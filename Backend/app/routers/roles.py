from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uuid

# Use the specific dependencies and models required for this router
from app.dependencies import get_current_user, get_supabase_client
from app.models.user import User

# --- THIS IS THE FIX ---
# The prefix="/roles" has been removed from the router definition.
# The prefix is now correctly handled only in the main.py file where the router is included.
router = APIRouter(
    tags=["Roles & JDs"],
)

# --- Pydantic Response Model ---
# This defines the exact structure of the data we'll send to the frontend.
class JdSummary(BaseModel):
    jd_id: uuid.UUID
    title: str  # This title is generated for the dropdown UI
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_required: Optional[str] = None
    jd_parsed_summary: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=List[JdSummary])
async def get_user_jds(
    current_user: User = Depends(get_current_user),
    supabase = Depends(get_supabase_client)
):
    """
    Fetches a list of all Job Descriptions (JDs) that have been
    uploaded by the currently authenticated user.
    """
    try:
        # Query fetches all JDs where the user_id matches the current user's ID.
        response = supabase.table("jds").select(
            "jd_id", 
            "jd_parsed_summary", 
            "location", 
            "job_type", 
            "experience_required"
        ).eq("user_id", str(current_user.id)).execute()

        if not response.data:
            return []
        
        # Manually construct the response to create a 'title' for the dropdown UI.
        jds_to_return = []
        for item in response.data:
            summary = item.get("jd_parsed_summary", "Untitled Role")
            # The title is derived from the first line of the summary.
            title = summary.split('\n')[0].strip() if summary else "Untitled Role"
            
            # Create a JdSummary object to ensure type safety
            jd_summary = JdSummary(
                jd_id=item["jd_id"],
                title=title,
                location=item.get("location"),
                job_type=item.get("job_type"),
                experience_required=item.get("experience_required"),
                jd_parsed_summary=summary
            )
            jds_to_return.append(jd_summary)

        return jds_to_return

    except Exception as e:
        print(f"Error fetching JDs for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch job descriptions.")

