# backend/app/services/jd_parsing_service.py
import os
import json
import mimetypes
from pathlib import Path
from datetime import datetime
import tempfile

import google.generativeai as genai
from supabase import Client
import docx2txt
from pypdf import PdfReader
from app.config import settings

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


def parse_jd_text(text: str) -> dict:
    """
    Calls the Google Gemini API to parse text and normalizes the response.
    """
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # --- START: CORRECTION ---
        # The model name has been updated to the latest stable version.
        model = genai.GenerativeModel('gemini-1.5-flash')
        # --- END: CORRECTION ---

        prompt = f"""You are an expert job description parser. Extract the following fields from the provided job description text:

- location: City/State/Country if present; else null/empty
- job_type: One of ['Full Time', 'Part Time', 'Internship', 'Contract'] if you can infer, else null/empty
- experience_required: Return as short free text, e.g. '2-3 years', '5+ years', or null/empty
- jd_parsed_summary: 2-4 sentence summary capturing the role, seniority, key responsibilities, and core skills.

If a field is not present, return it as an empty string.
Return strictly as compact JSON with keys: location, job_type, experience_required, jd_parsed_summary.

Job Description Text:
---
{text[:120000]}
---"""

        response = model.generate_content(prompt)
        
        content = response.text.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]

        data = json.loads(content)

        normalized_data = {
            "location": (data.get("location") or "").strip(),
            "job_type": (data.get("job_type") or "").strip(),
            "experience_required": (data.get("experience_required") or "").strip(),
            "jd_parsed_summary": (data.get("jd_parsed_summary") or "").strip(),
        }

        allowed_job_types = {"Full Time", "Part Time", "Internship", "Contract"}
        if normalized_data["job_type"] not in allowed_job_types:
            normalized_data["job_type"] = ""

        return normalized_data

    except Exception as e:
        print(f"Error during Gemini API call: {e}")
        raise


def process_jd_file(supabase: Client, file_path: Path, user_id: str) -> dict:
    text = extract_text(file_path)
    if not text.strip():
        raise ValueError("No text could be extracted from the JD file.")

    parsed_data = parse_jd_text(text)

    bucket = "jds"
    ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    object_name = f"{user_id}/{ts}_{file_path.name}"
    
    with open(file_path, "rb") as f:
        content_type, _ = mimetypes.guess_type(file_path.name)
        supabase.storage.from_(bucket).upload(
            path=object_name, 
            file=f, 
            file_options={"contentType": content_type or "application/octet-stream"}
        )

    row = {
        "user_id": user_id,
        "file_url": object_name,
        "location": parsed_data.get("location") or None,
        "job_type": parsed_data.get("job_type") or None,
        "experience_required": parsed_data.get("experience_required") or None,
        "jd_parsed_summary": parsed_data.get("jd_parsed_summary") or None,
    }
    
    res = supabase.table("jds").insert(row).execute()
    
    if not res.data:
        raise RuntimeError(f"Supabase insert error: No data returned after insert.")
        
    return res.data[0]