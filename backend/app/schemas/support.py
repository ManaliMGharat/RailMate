from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class ComplaintCreate(BaseModel):
    pnr: Optional[str] = None
    train_number: Optional[str] = None
    station_code: Optional[str] = None
    category: str # "Train complaint", "Station complaint", "Cleanliness", "Catering", "Staff assistance", "Security assistance", "Medical assistance", "Other"
    description: str

class ComplaintAttachmentResponse(BaseModel):
    id: int
    file_name: str
    file_url: str

    class Config:
        from_attributes = True

class ComplaintResponse(BaseModel):
    id: int
    complaint_ref: str
    pnr: Optional[str]
    train_number: Optional[str]
    station_code: Optional[str]
    category: str
    description: str
    status: str
    resolution_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    attachments: List[ComplaintAttachmentResponse] = []

    class Config:
        from_attributes = True
