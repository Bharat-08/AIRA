# backend/app/routers/upload.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
import tempfile
from pathlib import Path
from openai import OpenAI, APITimeoutError, AuthenticationError, BadRequestError

from app.dependencies import get_current_user, get_supabase_client
from app.services.jd_parsing_service import process_jd_file
from app.services.resume_parsing_service import process_resume_file
from app.models.user import User
from app.config import settings # Import the settings object

router = APIRouter(
    prefix="/upload",
    tags=["Upload & Parse"],
)

# --- Production-Ready OpenAI Client Initialization ---
if not settings.OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY is not set in the environment. The application cannot start.")

openai_client = OpenAI(
    api_key=settings.OPENAI_API_KEY,
    timeout=120.0,
)

@router.post("/jd")
async def upload_jd(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    # Create a temporary file to store the upload
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = Path(tmp.name)

    try:
        result = process_jd_file(
            supabase=supabase,
            openai_client=openai_client,
            file_path=tmp_path,
            user_id=str(current_user.id)
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    # --- Improved Error Handling for OpenAI ---
    except APITimeoutError:
        print("OpenAI request timed out after 2 minutes.")
        raise HTTPException(status_code=504, detail="The request to the AI service timed out. Please try again later.")
    except AuthenticationError:
        print("OpenAI Authentication Error: The API key is invalid or has expired.")
        raise HTTPException(status_code=500, detail="Authentication with the AI service failed.")
    except BadRequestError as e:
        print(f"OpenAI Bad Request Error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid request to OpenAI: {e.body.get('message')}")
    # --- End of Improvement ---
    except Exception as e:
        print(f"An unexpected error occurred during JD processing: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred.")
    finally:
        # Ensure the temporary file is always deleted
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
            result = process_resume_file(
                supabase=supabase,
                openai_client=openai_client,
                file_path=tmp_path,
                user_id=str(current_user.id),
                jd_id=jd_id
            )
            results.append(result)
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})
        finally:
            if tmp_path.exists():
                tmp_path.unlink()
            
    if not results and errors:
        raise HTTPException(status_code=500, detail={"message": "All resume uploads failed.", "errors": errors})

    return {"successful_uploads": results, "failed_uploads": errors}
