from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models
from ..db.session import get_db
from ..dependencies import get_current_user
# CORRECTED: Importing the specific schema directly
from ..schemas.jd import JDSchema

router = APIRouter()

@router.get("/roles", response_model=List[JDSchema]) # CORRECTED: Using the direct import
def read_roles_for_organization(
    db: Session = Depends(get_db),
    current_user: models.user.User = Depends(get_current_user)
):
    """
    Retrieve all job descriptions for the current user's organization.

    This works by first finding all users in the organization and then
    collecting all JDs associated with those users.
    """
    if not current_user.organization_id:
        raise HTTPException(
            status_code=403,
            detail="Operation not allowed: User is not associated with an organization."
        )

    # Step 1: Find all user IDs within the same organization as the current user.
    users_in_org = db.query(models.user.User.id).filter(
        models.user.User.organization_id == current_user.organization_id
    ).all()
    
    # Extract the UUIDs from the query result
    user_ids_in_org = [user_id for (user_id,) in users_in_org]

    if not user_ids_in_org:
        return [] # Return empty list if no users are in the organization

    # Step 2: Fetch all JDs where the user_id is in our list of organization members.
    roles = db.query(models.jd.JD).filter(
        models.jd.JD.user_id.in_(user_ids_in_org)
    ).all()

    return roles

