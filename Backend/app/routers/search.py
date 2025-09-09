import asyncio
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import threading

# Import dependencies from your app's structure
from ..dependencies import get_current_user
from ..models.user import User

try:
    from test_searcher import ErrorFixedDeepResearchAgent
    from ranker import ProfileRanker, Config as RankerConfig
except ImportError as e:
    raise ImportError(f"Could not import an agent. Ensure test_searcher.py and ranker.py are in the project root. Details: {e}")

# --- CANCELLATION MECHANISM ---
# A thread-safe dictionary to store cancellation flags for each user.
CANCELLATION_FLAGS = {}
lock = threading.Lock()


class SearchRequest(BaseModel):
    jd_id: str
    prompt: str

class RankedCandidateResponse(BaseModel):
    profile_id: str
    match_score: float
    strengths: str
    profile_name: Optional[str] = None
    role: Optional[str] = None
    company: Optional[str] = None
    profile_url: Optional[str] = None


router = APIRouter()

# Initialize agents
search_agent = ErrorFixedDeepResearchAgent()
ranker_config = RankerConfig.from_env()
ranker_agent = ProfileRanker(ranker_config)


# --- NEW ENDPOINT TO CANCEL A SEARCH ---
@router.post("/cancel")
async def cancel_search(current_user: User = Depends(get_current_user)):
    """Sets the cancellation flag for the current user to True."""
    user_id = str(current_user.id)
    with lock:
        CANCELLATION_FLAGS[user_id] = True
    print(f"Cancellation request received for user: {user_id}")
    return {"message": "Search cancellation requested."}


@router.post("/search")
async def search_and_rank_candidates(
    request: SearchRequest,
    current_user: User = Depends(get_current_user)
):
    user_id = str(current_user.id)
    
    # Reset the cancellation flag at the beginning of a new search
    with lock:
        CANCELLATION_FLAGS[user_id] = False

    try:
        # === STEP 1: Run the Search Agent ===
        print(f"Step 1: Searching for candidates for JD ID: {request.jd_id}...")
        unranked_candidates = search_agent.run_search_for_api(
            jd_id=request.jd_id,
            custom_prompt=request.prompt,
            user_id=user_id
        )
        print(f"Step 1 Complete: Found {len(unranked_candidates)} new candidates.")

        # === CHECK CANCELLATION FLAG ===
        with lock:
            if CANCELLATION_FLAGS.get(user_id):
                print(f"Search cancelled by user {user_id} after research phase.")
                raise HTTPException(status_code=499, detail="Search cancelled by user.")

        # === STEP 2: Run the Ranking Agent ===
        print(f"Step 2: Ranking all unranked candidates for JD ID: {request.jd_id}...")
        ranker_agent.config.user_id = user_id
        await ranker_agent.run_ranking_for_api(jd_id=request.jd_id)
        print("Step 2 Complete: Ranking finished.")

        # === STEP 3: Fetch and Join Ranked Results ===
        print("Step 3: Fetching final ranked candidates with full details...")
        rpc_params = {'jd_id_param': request.jd_id}
        ranked_response = ranker_agent.supabase.rpc('get_ranked_candidates_with_details', rpc_params).execute()
        
        return ranked_response.data if ranked_response.data else []
        
    except HTTPException as http_exc:
        # Re-raise cancellation exceptions so the frontend knows to stop quietly
        if http_exc.status_code == 499:
            return []
        raise http_exc
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred during the search and rank process: {str(e)}")