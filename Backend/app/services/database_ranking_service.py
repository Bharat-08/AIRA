# Backend/app/services/database_ranking_service.py

import asyncio
import json
import logging
import re
from typing import Dict, List, Optional, Tuple

from app.config import settings
from google import genai
from google.generative_ai import types
from supabase.client import Client  # <-- CORRECT IMPORT for your project

# Setup logging
logger = logging.getLogger(__name__)


class DatabaseProfileRanker:
    """
    A service class to rank profiles.
    This version is now CORRECTED to be compatible with your project's
    synchronous Supabase client.
    """

    def __init__(self, supabase_client: Client, user_id: str):
        self.supabase = supabase_client  # Expecting the synchronous client
        self.user_id = user_id
        self.batch_size: int = 3
        self.max_retries: int = 3

        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(
            settings.GEMINI_MODEL_NAME or "gemini-1.5-pro-latest"
        )
        logger.info(f"Initialized ranker with model: {self.model.model_name}")

    async def get_unranked_resumes(self, jd_id: str) -> List[Dict]:
        """
        Fetches unranked resumes using the synchronous client in a non-blocking way.
        """
        try:
            logger.info(f"Querying resumes for jd_id={jd_id}...")

            # Run synchronous DB calls in a separate thread
            resumes_resp = await asyncio.to_thread(
                self.supabase.table("resume")
                .select("resume_id,json_content,person_name,role,company")
                .eq("jd_id", jd_id)
                .execute
            )
            ranked_resp = await asyncio.to_thread(
                self.supabase.table("ranked_candidates_from_resume")
                .select("resume_id")
                .eq("jd_id", jd_id)
                .execute
            )

            resumes = resumes_resp.data or []
            ranked_ids = {r["resume_id"] for r in (ranked_resp.data or [])}
            logger.info(f"Found {len(resumes)} total resumes and {len(ranked_ids)} ranked resumes.")
            
            # This part is synchronous and fast, no thread needed
            candidates = [
                {
                    "jd_id": jd_id,
                    "resume_id": r["resume_id"],
                    "person_name": r.get("person_name"),
                    "role": r.get("role"),
                    "company": r.get("company"),
                    "summary": r.get("json_content"),
                }
                for r in resumes
                if r.get("resume_id") and r.get("resume_id") not in ranked_ids
            ]

            logger.info(f"{len(candidates)} unranked resumes will be processed.")
            return candidates
        except Exception as e:
            logger.error(f"Error fetching unranked resumes: {e}", exc_info=True)
            return []
    
    # No changes needed for the following helper methods
    def format_candidate_data(self, candidate: Dict) -> str:
        parts = []
        if candidate.get("person_name"): parts.append(f"Name: {candidate['person_name']}")
        if candidate.get("role"): parts.append(f"Role: {candidate['role']}")
        if candidate.get("company"): parts.append(f"Company: {candidate['company']}")
        summary_content = candidate.get("summary")
        if summary_content:
            try:
                json_data = json.loads(summary_content) if isinstance(summary_content, str) else summary_content
                if isinstance(json_data, dict):
                    if "skills" in json_data: parts.append(f"Skills: {json_data.get('skills')}")
                    if "experience" in json_data:
                        exp = json_data.get("experience")
                        exp_text = "; ".join([str(e) for e in exp]) if isinstance(exp, list) else str(exp)
                        parts.append(f"Experience: {exp_text}")
                    if "education" in json_data: parts.append(f"Education: {json_data.get('education')}")
                else: parts.append(f"Summary: {str(summary_content)}")
            except (json.JSONDecodeError, TypeError): parts.append(f"Summary: {str(summary_content)}")
        return "\n".join(parts) or "Limited profile information"

    def parse_llm_response(self, response_text: str) -> Tuple[float, str]:
        if not response_text: return 0.0, "Error: No response from LLM"
        try:
            cleaned = re.sub(r"```json\n|```", "", response_text).strip()
            parsed = json.loads(cleaned)
            match_score = float(parsed.get("match_score", 0.0))
            verdict = parsed.get("verdict", "N/A")
            strengths = parsed.get("strengths", [])
            weaknesses = parsed.get("weaknesses", [])
            reasoning = parsed.get("reasoning", "No reasoning provided.")
            strengths_text = "\n".join(f"- {s}" for s in strengths) if strengths else "None identified."
            weaknesses_text = "\n".join(f"- {w}" for w in weaknesses) if weaknesses else "None identified."
            formatted = (f"**Verdict:** {verdict}\n\n**Strengths:**\n{strengths_text}\n\n**Weaknesses/Gaps:**\n{weaknesses_text}\n\n**Reasoning:**\n{reasoning}")
            score = max(0.0, min(100.0, match_score))
            return score, formatted
        except Exception as e:
            logger.error(f"Failed to parse LLM response: {e}", exc_info=True)
            return 0.0, f"Error parsing response: {e}"

    async def rank_candidate(self, candidate: Dict, jd: Dict) -> Optional[Dict]:
        """Calls the LLM and saves results using non-blocking DB calls."""
        for attempt in range(self.max_retries):
            try:
                candidate_text = self.format_candidate_data(candidate)
                prompt = f"""
You are an expert technical recruiter...
Job Title: {jd.get('title', 'N/A')}
...
Candidate Profile:
{candidate_text}
...
Return a single JSON object...
"""
                # The Gemini call is already async, so it's fine
                response = await self.model.generate_content_async(
                    contents=prompt,
                    generation_config=types.GenerationConfig(
                        temperature=0.4, max_output_tokens=4096, response_mime_type="application/json"
                    ),
                )
                if not response.candidates or response.candidates[0].finish_reason.name != "STOP":
                    raise Exception(f"LLM returned non-standard finish reason.")
                
                match_score, formatted_summary = self.parse_llm_response(response.text)
                if "Error" in formatted_summary: raise Exception(formatted_summary)

                score_rounded = round(float(match_score), 2)
                row = {
                    "user_id": self.user_id, "jd_id": jd["jd_id"], "resume_id": candidate["resume_id"],
                    "match_score": score_rounded, "strengths": formatted_summary,
                }
                
                # Run the synchronous insert in a thread
                await asyncio.to_thread(
                    self.supabase.table("ranked_candidates_from_resume").insert(row).execute
                )
                logger.info(f"Inserted ranking for resume {candidate['resume_id']} with score {score_rounded}")
                return {"resume_id": candidate["resume_id"], "match_score": score_rounded}

            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed for resume {candidate['resume_id']}: {e}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(5)
                else:
                    logger.error(f"All attempts failed for resume {candidate['resume_id']}; saving error row.")
                    try:
                        err_row = {
                            "user_id": self.user_id, "jd_id": jd["jd_id"], "resume_id": candidate["resume_id"],
                            "match_score": 0.00, "strengths": f"Evaluation failed: {str(e)[:1000]}",
                        }
                        # Run the synchronous error insert in a thread
                        await asyncio.to_thread(
                           self.supabase.table("ranked_candidates_from_resume").insert(err_row).execute
                        )
                    except Exception as db_e:
                        logger.error(f"Failed to insert error row for resume {candidate['resume_id']}: {db_e}")
                    return None
    
    async def process_batches(self, candidates: List[Dict], jd: Dict) -> List[Dict]:
        results = []
        for i in range(0, len(candidates), self.batch_size):
            batch = candidates[i : i + self.batch_size]
            logger.info(f"Processing batch {(i // self.batch_size) + 1} ({len(batch)} resumes)")
            tasks = [self.rank_candidate(c, jd) for c in batch]
            batch_results = await asyncio.gather(*tasks)
            results.extend([r for r in batch_results if r])
            if i + self.batch_size < len(candidates):
                logger.info("Sleeping 5s before next batch...")
                await asyncio.sleep(5)
        return results

    async def run(self, jd_id: str):
        """Main execution method, now using non-blocking DB calls."""
        logger.info(f"Starting database ranking for JD: {jd_id}")

        # Run synchronous DB call in a thread
        jd_resp = await asyncio.to_thread(
            self.supabase.table("jds").select("*").eq("jd_id", jd_id).single().execute
        )
        if not jd_resp.data:
            logger.error(f"No JD found with id {jd_id}. Aborting.")
            return
        jd = jd_resp.data

        candidates = await self.get_unranked_resumes(jd_id)
        if not candidates:
            logger.info(f"No new unranked resumes to process for JD {jd_id}.")
            return

        logger.info(f"Found {len(candidates)} unranked resumes. Starting ranking...")
        await self.process_batches(candidates, jd)
        logger.info(f"Finished database ranking workflow for JD {jd_id}.")