import asyncio
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional

# Import dependencies from your app's structure
from ..dependencies import get_current_user
from ..models.user import User

# It's good practice to wrap potentially missing imports in a try/except block
# This makes it clear that these are external dependencies for this router.
try:
    from test_searcher import ErrorFixedDeepResearchAgent
    from ranker import ProfileRanker, Config as RankerConfig
except ImportError as e:
    raise ImportError(f"Could not import an agent. Ensure test_searcher.py and ranker.py are in the project root. Details: {e}")

# --- Pydantic Models for API Request and Response ---

class SearchRequest(BaseModel):
    """Defines the expected input for a search request."""
    jd_id: str
    prompt: str

class RankedCandidateResponse(BaseModel):
    """
    Defines the structure of the candidate data returned to the frontend.
    This model now includes all fields required by the UI design.
    """
    profile_id: str
    match_score: float
    strengths: str
    profile_name: Optional[str] = None
    role: Optional[str] = None
    company: Optional[str] = None
    # --- CHANGE: Added profile_url to match frontend requirements ---
    profile_url: Optional[str] = None

# --- Router Initialization ---

router = APIRouter()

# --- Agent Initialization ---
# Initialize agents globally to be reused across requests.
try:
    search_agent = ErrorFixedDeepResearchAgent()
    print("Successfully initialized ErrorFixedDeepResearchAgent.")
    
    ranker_config = RankerConfig.from_env()
    ranker_agent = ProfileRanker(ranker_config)
    print("Successfully initialized ProfileRanker.")

except Exception as e:
    # If agents fail to initialize, log the error and set them to None.
    # The endpoint will then return a 503 Service Unavailable error.
    print(f"FATAL: Failed to initialize an agent: {e}")
    search_agent = None
    ranker_agent = None

# --- API Endpoint ---

@router.post("/search", response_model=List[RankedCandidateResponse])
async def search_and_rank_candidates(
    request: SearchRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Orchestrates the full search-then-rank workflow.
    1. Runs the search agent to find new candidates and save them to the 'search' table.
    2. Runs the ranking agent to score all unranked candidates for the job.
    3. Fetches the final ranked candidates with full details and returns them.
    """
    if not search_agent or not ranker_agent:
        raise HTTPException(status_code=503, detail="An agent is not available due to an initialization error.")

    try:
        # === STEP 1: Run the Search Agent ===
        print(f"Step 1: Searching for candidates for JD ID: {request.jd_id}...")
        unranked_candidates = search_agent.run_search_for_api(
            jd_id=request.jd_id,
            custom_prompt=request.prompt,
            user_id=str(current_user.id)
        )
        print(f"Step 1 Complete: Found {len(unranked_candidates)} new candidates.")

        # === STEP 2: Run the Ranking Agent ===
        print(f"Step 2: Ranking all unranked candidates for JD ID: {request.jd_id}...")
        # Pass the user's ID to the ranker's config to operate in the correct user context.
        ranker_agent.config.user_id = str(current_user.id)
        await ranker_agent.run_ranking_for_api(jd_id=request.jd_id)
        print("Step 2 Complete: Ranking finished.")

        # === STEP 3: Fetch and Join Ranked Results ===
        print("Step 3: Fetching final ranked candidates with full details...")
        
        # This RPC function joins 'ranked_candidates' with 'search' to get all details.
        # Ensure 'get_ranked_candidates_with_details' is created in Supabase.
        rpc_params = {'jd_id_param': request.jd_id}
        ranked_response = ranker_agent.supabase.rpc('get_ranked_candidates_with_details', rpc_params).execute()
        
        if ranked_response.data:
            print(f"Step 3 Complete: Found {len(ranked_response.data)} ranked candidates to return.")
            return ranked_response.data
        else:
            print("Step 3 Complete: No ranked candidates found for this JD.")
            return []
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred during the search and rank process: {str(e)}")
