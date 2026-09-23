from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class RefundCalculateRequest(BaseModel):
    booking_id: int

class RefundCalculateResponse(BaseModel):
    booking_id: int
    booking_ref: str
    original_amount: float
    cancellation_charge: float
    estimated_refund: float
    policy_note: str

class RefundCreateRequest(BaseModel):
    booking_id: int
    reason: Optional[str] = "Travel plans changed"

class RefundResponse(BaseModel):
    id: int
    refund_ref: str
    booking_id: int
    original_amount: float
    cancellation_charge: float
    refund_amount: float
    reason: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
