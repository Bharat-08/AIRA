# backend/app/schemas/jd.py

from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid

# This schema defines the structure for API responses for a single JD
class JDSchema(BaseModel):
    jd_id: uuid.UUID
    user_id: uuid.UUID
    file_url: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_required: Optional[str] = None
    jd_parsed_summary: Optional[str] = None
    created_at: datetime

    # The 'title' is a key part of the UI design.
    # We will need to add a title field to the jds table or derive it.
    # For now, we will add it to the schema and can populate it from another field.
    title: Optional[str] = "Default Role Title" # Placeholder

    class Config:
        from_attributes = True # Pydantic v2 setting
