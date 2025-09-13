import asyncio
import os
import sys
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import threading

# Import dependencies from your app's structure
from ..dependencies import get_current_user, get_supabase_client
from ..models.user import User

# --- START: MODIFICATION (Addition Only) ---
# Import the new LinkedInFinder service and Supabase client
from ..services.linkedin_finder_service import LinkedInFinder
from supabase import Client
# --- END: MODIFICATION ---

# --- NO CHANGE to your original agent imports ---
try:
    from test_searcher import ErrorFixedDeepResearchAgent
    from ranker import ProfileRanker, Config as RankerConfig
except ImportError as e:
    raise ImportError(f"Could not import an agent. Ensure test_searcher.py and ranker.py are in the project root. Details: {e}")

# --- CANCELLATION MECHANISM (Unchanged) ---
CANCELLATION_FLAGS = {}
lock = threading.Lock()

# --- ORIGINAL MODELS (Unchanged) ---
class SearchRequest(BaseModel):
    jd_id: str
    prompt: str

# --- START: NEW MODEL FOR LINKEDIN URL REQUEST ---
class LinkedInRequest(BaseModel):
    profile_id: str
# --- END: NEW MODEL ---

class RankedCandidateResponse(BaseModel):
    profile_id: str
    match_score: float
    strengths: str
    profile_name: Optional[str] = None
    role: Optional[str] = None
    company: Optional[str] = None
    profile_url: Optional[str] = None


router = APIRouter()
logger = logging.getLogger(__name__)

# --- NO CHANGE to your original agent initialization ---
search_agent = ErrorFixedDeepResearchAgent()
ranker_config = RankerConfig.from_env()
ranker_agent = ProfileRanker(ranker_config)

# --- START: NEW AGENT INITIALIZATION ---
# Initialize the new LinkedInFinder agent
linkedin_finder_agent = LinkedInFinder()
# --- END: NEW AGENT INITIALIZATION ---


# --- CANCEL ENDPOINT (Unchanged) ---
@router.post("/cancel")
async def cancel_search(current_user: User = Depends(get_current_user)):
    """Sets the cancellation flag for the current user to True."""
    user_id = str(current_user.id)
    with lock:
        CANCELLATION_FLAGS[user_id] = True
    print(f"Cancellation request received for user: {user_id}")
    return {"message": "Search cancellation requested."}

# --- START: NEW ENDPOINT FOR LINKEDIN URL GENERATION ---
@router.post("/generate-linkedin-url")
async def generate_linkedin_url(
    request: LinkedInRequest,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Generates a LinkedIn URL for a specific candidate on-demand by
    calling the LinkedInFinder service.
    """
    profile_id = request.profile_id
    
    try:
        # This now calls the method that saves to the 'ranked_candidates' table
        generated_url = linkedin_finder_agent.find_and_update_url(
            profile_id=profile_id,
            supabase=supabase
        )

        if not generated_url:
            raise HTTPException(
                status_code=404, 
                detail=f"Could not find a LinkedIn URL for candidate {profile_id}."
            )

        return {"linkedin_url": generated_url}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
# --- END: NEW ENDPOINT ---


# --- MAIN SEARCH ENDPOINT (Unchanged) ---
@router.post("/search")
async def search_and_rank_candidates(
    request: SearchRequest,
    current_user: User = Depends(get_current_user)
):
    user_id = str(current_user.id)
    
    with lock:
        CANCELLATION_FLAGS[user_id] = False

    try:
        print(f"Step 1: Searching for candidates for JD ID: {request.jd_id}...")
        unranked_candidates = search_agent.run_search_for_api(
            jd_id=request.jd_id,
            custom_prompt=request.prompt,
            user_id=user_id
        )
        print(f"Step 1 Complete: Found {len(unranked_candidates)} new candidates.")

        with lock:
            if CANCELLATION_FLAGS.get(user_id):
                print(f"Search cancelled by user {user_id} after research phase.")
                raise HTTPException(status_code=499, detail="Search cancelled by user.")

        print(f"Step 2: Ranking all unranked candidates for JD ID: {request.jd_id}...")
        ranker_agent.config.user_id = user_id
        await ranker_agent.run_ranking_for_api(jd_id=request.jd_id)
        print("Step 2 Complete: Ranking finished.")

        print("Step 3: Fetching final ranked candidates with full details...")
        rpc_params = {'jd_id_param': request.jd_id}
        ranked_response = ranker_agent.supabase.rpc('get_ranked_candidates_with_details', rpc_params).execute()
        
        return ranked_response.data if ranked_response.data else []
        
    except HTTPException as http_exc:
        if http_exc.status_code == 499:
            return []
        raise http_exc
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred during the search and rank process: {str(e)}")

# --- START: NEW ENDPOINT FOR "MY DATABASE" ---
@router.post("/rank-resumes")
async def rank_resumes(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Ranks resumes from the 'resume' table for a given JD and returns the ranked candidates.
    """
    jd_id = request.jd_id
    user_id = str(current_user.id)

    try:
        # Resolve my_database.py absolute path
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))  # /app/app/routers -> /app
        script_path = os.path.join(base_dir, "my_database.py")
        if not os.path.isfile(script_path):
            alt = os.path.join(os.getcwd(), "my_database.py")
            if os.path.isfile(alt):
                script_path = alt

        if not os.path.isfile(script_path):
            logger.error("Script not found at %s (cwd=%s)", script_path, os.getcwd())
            raise HTTPException(status_code=500, detail=f"Script not found at {script_path}")

        logger.info("Running ranking script: %s for jd_id=%s user_id=%s", script_path, jd_id, user_id)

        # Ensure subprocess inherits environment
        env = os.environ.copy()

        # Call my_database.py with BOTH jd_id and user_id
        process = await asyncio.create_subprocess_exec(
            sys.executable, script_path, jd_id, user_id,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env
        )
        stdout_bytes, stderr_bytes = await process.communicate()
        stdout = stdout_bytes.decode(errors="replace") if stdout_bytes else ""
        stderr = stderr_bytes.decode(errors="replace") if stderr_bytes else ""

        logger.info("my_database.py exit_code=%s", process.returncode)
        if stdout:
            logger.info("my_database.py stdout:\n%s", stdout)
        if stderr:
            logger.warning("my_database.py stderr:\n%s", stderr)

        if process.returncode != 0:
            detail = f"Ranking script failed. exit={process.returncode}. stderr={stderr[:1000]}"
            logger.error(detail)
            raise HTTPException(status_code=500, detail=detail)

        # Fetch ranked candidates using RPC
        rpc_params = {'jd_id_param': jd_id}
        ranked_response = supabase.rpc('get_ranked_resumes_with_details', rpc_params).execute()
        logger.info("RPC returned %d rows (error=%s)", len(ranked_response.data or []), getattr(ranked_response, "error", None))

        return ranked_response.data if ranked_response.data else []

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("An error occurred during resume ranking: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
# --- END: NEW ENDPOINT ---