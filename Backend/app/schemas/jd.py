# Backend/app/schemas/jd.py

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class JdBase(BaseModel):
    role: str  # Changed from title to role
    location: Optional[str] = None
    experience_required: Optional[str] = None
    jd_parsed_summary: Optional[str] = None
    key_requirements: Optional[str] = None
    status: Optional[str] = 'open'

class JdCreate(JdBase):
    pass

class Jd(JdBase):
    jd_id: str
    user_id: str
    created_at: datetime

    class Config:
        orm_mode = True

class JdSummary(BaseModel):
    jd_id: str
    role: str # Changed from title to role
    location: Optional[str] = None
    created_at: datetime
    jd_parsed_summary: Optional[str] = None
    experience_required: Optional[str] = None
    key_requirements: Optional[str] = None

    class Config:
        orm_mode = True