from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List

# Import dependencies from your app's structure
from ..dependencies import get_current_user
from ..models.user import User

try:
    # Because test_searcher.py is mounted in the WORKDIR (/app),
    # a direct import will now succeed.
    from test_searcher import ErrorFixedDeepResearchAgent, Candidate
except ImportError:
    # This error will now only trigger if the volume mount in docker-compose.yml is missing.
    raise ImportError("Could not import 'test_searcher.py'. Please ensure it is correctly mounted in docker-compose.yml.")

# Define the request model for our new endpoint
class SearchRequest(BaseModel):
    jd_id: str
    prompt: str

router = APIRouter()

# Initialize the agent once to reuse it across requests
try:
    agent = ErrorFixedDeepResearchAgent()
    print("Successfully initialized ErrorFixedDeepResearchAgent.")
except Exception as e:
    print(f"FATAL: Failed to initialize ErrorFixedDeepResearchAgent: {e}")
    agent = None

@router.post("/search", response_model=List[Candidate])
def search_and_rank_candidates(
    request: SearchRequest,
    current_user: User = Depends(get_current_user) # This injects the logged-in user
):
    """
    This endpoint receives a jd_id and a prompt, triggers the deep research agent
    using the current user's ID, and returns the list of found candidates.
    """
    if not agent:
        raise HTTPException(status_code=503, detail="Search agent is not available due to an initialization error.")

    try:
        print(f"Starting search for JD ID: {request.jd_id} with prompt: '{request.prompt}' by user: {current_user.email}")
        
        # --- THIS IS THE FIX ---
        # We now pass the authenticated user's ID directly to the agent's method.
        # The user's ID is converted to a string to ensure type compatibility.
        candidates = agent.run_search_for_api(
            jd_id=request.jd_id,
            custom_prompt=request.prompt,
            user_id=str(current_user.id) # Pass the current user's ID here
        )
        
        print(f"Found and saved {len(candidates)} candidates.")
        return candidates
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"An error occurred during the search process: {e}")
        raise HTTPException(status_code=500, detail=str(e))