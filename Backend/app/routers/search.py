import asyncio
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional

# Import dependencies from your app's structure
from ..dependencies import get_current_user
from ..models.user import User

try:
    # Import both agents
    from test_searcher import ErrorFixedDeepResearchAgent
    from ranker import ProfileRanker, Config as RankerConfig
except ImportError as e:
    raise ImportError(f"Could not import an agent. Ensure test_searcher.py and ranker.py are in the project root. Details: {e}")

# Define the request and response models
class SearchRequest(BaseModel):
    jd_id: str
    prompt: str

class RankedCandidateResponse(BaseModel):
    profile_id: str
    match_score: float
    strengths: str # This contains the formatted summary from the ranker
    # Add other fields you might want to display from the ranked_candidates table
    profile_name: Optional[str] = None
    role: Optional[str] = None
    company: Optional[str] = None


router = APIRouter()

# Initialize both agents
try:
    search_agent = ErrorFixedDeepResearchAgent()
    print("Successfully initialized ErrorFixedDeepResearchAgent.")
    
    ranker_config = RankerConfig.from_env()
    ranker_agent = ProfileRanker(ranker_config)
    print("Successfully initialized ProfileRanker.")

except Exception as e:
    print(f"FATAL: Failed to initialize an agent: {e}")
    search_agent = None
    ranker_agent = None

@router.post("/search", response_model=List[RankedCandidateResponse])
async def search_and_rank_candidates(
    request: SearchRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Orchestrates the full search-then-rank workflow.
    1. Runs the search agent to find new candidates and save them.
    2. Runs the ranking agent to score all unranked candidates for the job.
    3. Fetches the final ranked candidates (including name, role, etc.) and returns them.
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
        # We pass the user's ID to the ranker's config to ensure it operates in the correct user context
        ranker_agent.config.user_id = str(current_user.id)
        await ranker_agent.run_ranking_for_api(jd_id=request.jd_id)
        print("Step 2 Complete: Ranking finished.")

        # === STEP 3: Fetch and Join Ranked Results ===
        print("Step 3: Fetching final ranked candidates with full details...")
        
        # This query joins the ranked results with the original search/resume data
        # to get all the details (name, role, etc.) needed for the frontend.
        rpc_params = {'p_jd_id': request.jd_id}
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