from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
import tempfile
from pathlib import Path

from app.dependencies import get_current_user, get_supabase_client
from app.models.user import User
from app.schemas.jd import JdSummary
# --- MODIFICATION ---
# Import the correct function from the service
from app.services.jd_parsing_service import process_jd_file

router = APIRouter(
    tags=["Roles & JDs"],
)

@router.get("/", response_model=List[JdSummary])
async def get_user_jds(
    current_user: User = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """
    Fetches a list of all Job Descriptions (JDs) for the logged-in user.
    """
    try:
        response = supabase.table("jds").select(
            "jd_id", "role", "location", "job_type", "experience_required",
            "jd_parsed_summary", "created_at", "key_requirements"
        ).eq("user_id", str(current_user.id)).execute()

        if not response.data:
            return []

        roles_to_return = []
        for item in response.data:
            roles_to_return.append(
                JdSummary(
                    jd_id=item.get("jd_id"),
                    title=item.get("role", "Untitled Role"),
                    role=item.get("role"),
                    location=item.get("location"),
                    job_type=item.get("job_type"),
                    experience_required=item.get("experience_required"),
                    jd_parsed_summary=item.get("jd_parsed_summary"),
                    created_at=item.get("created_at"),
                    key_requirements=item.get("key_requirements"),
                )
            )
        return roles_to_return

    except Exception as e:
        print(f"An error occurred while fetching roles: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred.")


@router.post("/", response_model=JdSummary, status_code=201)
async def create_jd(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """
    Creates a new Job Description by uploading and parsing a file.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file was uploaded.")

    tmp_path = ""
    try:
        # Create a temporary file to store the upload
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # --- FIX ---
        # The 'process_jd_file' function is now used to handle the entire
        # process of parsing, uploading to storage, and returning the data.
        # This resolves the ImportError.
        new_jd_data = process_jd_file(
            supabase=supabase,
            file_path=Path(tmp_path),
            user_id=str(current_user.id)
        )

        # The function already returns the data in the correct format,
        # so we can directly return it.
        return new_jd_data

    except Exception as e:
        print(f"An error occurred while creating a role: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred.")
    finally:
        # Ensure the temporary file is cleaned up
        if tmp_path and Path(tmp_path).exists():
            Path(tmp_path).unlink()