# backend/app/services/resume_parsing_service.py
import os
import json
import mimetypes
from pathlib import Path
from datetime import datetime
import tempfile

from openai import OpenAI
from supabase import Client
import docx2txt
from pypdf import PdfReader

# --- Text Extraction Logic (Shared) ---
def extract_text(path: Path) -> str:
    ext = path.suffix.lower()
    if ext == ".txt":
        return path.read_text(encoding="utf-8", errors="ignore")
    elif ext == ".docx":
        return docx2txt.process(str(path)) or ""
    elif ext == ".pdf":
        text_parts = []
        with open(path, "rb") as f:
            reader = PdfReader(f)
            for page in reader.pages:
                text_parts.append(page.extract_text() or "")
        return "\n".join(text_parts).strip()
    raise ValueError(f"Unsupported file type: {ext}")

# --- Resume Parser Logic ---
RESUME_SYSTEM_PROMPT = """You are an expert resume parser. Extract a comprehensive JSON profile and key fields from the resume text.

Return strictly valid JSON with these top-level keys:
- person_name: string (best guess, full name; empty if unknown)
- role: string (current or most recent role title; empty if unknown)
- company: string (current or most recent company; empty if unknown)
- profile_url: string (LinkedIn or personal site if present; empty if unknown)
- json_content: object with detailed fields:
  - contact: { emails: [..], phones: [..], locations: [..], links: [..] }
  - summary: string (professional summary)
  - skills: { hard_skills: [..], soft_skills: [..], tools: [..], languages: [..] }
  - education: [ { degree, field, institution, start_date, end_date, location, gpa } ]
  - experience: [ 
      { title, company, location, start_date, end_date, current, bullets: [..], achievements: [..], skills: [..] } 
    ]
  - projects: [ { name, description, technologies: [..], links: [..] } ]
  - certifications: [ { name, issuer, date } ]
  - publications: [ { title, venue, date, link } ]
  - awards: [ { name, issuer, date } ]
  - extras: { volunteer: [..], interests: [..] }

Rules:
- Use empty strings, empty arrays, or nulls where information is missing.
- Normalize dates to ISO-like 'YYYY-MM' when possible, else original text.
- Do not invent data; infer conservatively from the text.
"""
RESUME_USER_TEMPLATE = "Resume Text:\n---\n{content}\n---"

def parse_resume_text(client: OpenAI, text: str) -> dict:
    resp = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        messages=[
            {"role": "system", "content": RESUME_SYSTEM_PROMPT},
            {"role": "user", "content": RESUME_USER_TEMPLATE.format(content=text[:120000])},
        ],
        response_format={"type": "json_object"},
    )
    data = json.loads(resp.choices[0].message.content)
    return data

def process_resume_file(supabase: Client, openai_client: OpenAI, file_path: Path, user_id: str, jd_id: str) -> dict:
    text = extract_text(file_path)
    if not text.strip():
        raise ValueError(f"No text could be extracted from the resume: {file_path.name}")

    parsed_data = parse_resume_text(openai_client, text)

    # Upload the original file to Supabase storage
    bucket = "resumes"
    ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    object_name = f"{user_id}/{ts}_{file_path.name}"
    
    with open(file_path, "rb") as f:
        content_type, _ = mimetypes.guess_type(file_path.name)
        supabase.storage.from_(bucket).upload(
            path=object_name, 
            file=f, 
            file_options={"contentType": content_type or "application/octet-stream"}
        )

    # The row now includes all top-level columns from your 'resume' table,
    # mapping empty strings to None to prevent database errors.
    row = {
        "jd_id": jd_id,
        "user_id": user_id,
        "file_url": object_name,
        "json_content": parsed_data.get("json_content") or {},
        "person_name": (parsed_data.get("person_name") or "").strip() or None,
        "role": (parsed_data.get("role") or "").strip() or None,
        "company": (parsed_data.get("company") or "").strip() or None,
        "profile_url": (parsed_data.get("profile_url") or "").strip() or None,
    }
    
    # --- THIS IS THE FIX ---
    # Changed table name from "resumes" to "resume" to match the database schema.
    res = supabase.table("resume").insert(row).execute()
    # --- END OF FIX ---
    
    if not res.data:
        raise RuntimeError(f"Supabase insert error: No data returned after insert.")
        
    return res.data[0]
