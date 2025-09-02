# In backend/app/routers/favorites.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.security.deps import require_user
from app.models.favorite import Favorite
from app.schemas.favorite import FavoriteCreate

router = APIRouter()

# In backend/app/routers/favorites.py

@router.post("/favorites", status_code=status.HTTP_201_CREATED)
def favorite_a_candidate(
    favorite_data: FavoriteCreate,
    db: Session = Depends(get_db),
    ctx: dict = Depends(require_user)
):
    """
    Saves a candidate as a favorite for the current user and their organization.
    """
    user = ctx["user"]
    membership = ctx["membership"]

    # Check if this candidate is already favorited for this job
    existing_favorite = db.query(Favorite).filter(
        Favorite.org_id == membership.org_id,
        Favorite.job_id == favorite_data.job_id,
        Favorite.candidate_id == favorite_data.candidate_id
    ).first()

    if existing_favorite:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This candidate has already been favorited for this job."
        )

    # --- vvv THIS IS THE CORRECTED LINE vvv ---
    # Use .model_dump(mode="json") to convert all special Pydantic
    # types (like HttpUrl) into JSON-compatible types (like strings).
    ranking_json = favorite_data.ranking_data.model_dump(mode="json")
    # --- ^^^ THIS IS THE CORRECTED LINE ^^^ ---

    new_favorite = Favorite(
        user_id=user.id,
        org_id=membership.org_id,
        job_id=favorite_data.job_id,
        candidate_id=favorite_data.candidate_id,
        ranking_data=ranking_json # Use the corrected JSON data
    )
    db.add(new_favorite)
    db.commit()
    
    return {"message": "Candidate favorited successfully."}


@router.get("/favorites/{job_id}", response_model=List[FavoriteCreate])
def get_favorites_for_job(
    job_id: str,
    db: Session = Depends(get_db),
    ctx: dict = Depends(require_user)
):
    """
    Retrieves all favorited candidates for a specific job within the user's organization.
    """
    membership = ctx["membership"]
    favorites = db.query(Favorite).filter(
        Favorite.org_id == membership.org_id,
        Favorite.job_id == job_id
    ).all()
    return favorites


@router.delete("/favorites/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfavorite_a_candidate(
    favorite_id: str,
    db: Session = Depends(get_db),
    ctx: dict = Depends(require_user)
):
    """
    Removes a candidate from the user's favorites.
    """
    membership = ctx["membership"]
    favorite_to_delete = db.query(Favorite).filter(
        Favorite.id == favorite_id,
        Favorite.org_id == membership.org_id
    ).first()

    if not favorite_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found.")

    db.delete(favorite_to_delete)
    db.commit()