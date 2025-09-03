from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
import tempfile
from pathlib import Path
# --- START: MODIFICATION ---
# All OpenAI related imports are now removed
# from openai import OpenAI, APITimeoutError, AuthenticationError, BadRequestError
# --- END: MODIFICATION ---

from app.dependencies import get_current_user, get_supabase_client
from app.services.jd_parsing_service import process_jd_file
from app.services.resume_parsing_service import process_resume_file
from app.models.user import User
from app.config import settings

router = APIRouter(
    prefix="/upload",
    tags=["Upload & Parse"],
)

# --- START: MODIFICATION ---
# The OpenAI client initialization is no longer needed and has been removed.
# --- END: MODIFICATION ---


@router.post("/jd")
async def upload_jd(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = Path(tmp.name)

    try:
        result = process_jd_file(
            supabase=supabase,
            file_path=tmp_path,
            user_id=str(current_user.id)
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"An unexpected error occurred during JD processing: {e}")
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")
    finally:
        if tmp_path.exists():
            tmp_path.unlink()


@router.post("/resumes/{jd_id}")
async def upload_resumes(
    jd_id: str,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    if not files:
        raise HTTPException(status_code=400, detail="No resume files provided.")

    results = []
    errors = []

    for file in files:
        if not file.filename:
            continue

        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = Path(tmp.name)

        try:
            # --- START: MODIFICATION ---
            # The openai_client argument has been removed from this call.
            result = process_resume_file(
                supabase=supabase,
                file_path=tmp_path,
                user_id=str(current_user.id),
                jd_id=jd_id
            )
            # --- END: MODIFICATION ---
            results.append(result)
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})
        finally:
            if tmp_path.exists():
                tmp_path.unlink()
            
    if not results and errors:
        raise HTTPException(status_code=500, detail={"message": "All resume uploads failed.", "errors": errors})

    return {"successful_uploads": results, "failed_uploads": errors}