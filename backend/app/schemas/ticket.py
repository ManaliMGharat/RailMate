from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class JourneyTicketCreate(BaseModel):
    from_station: str
    to_station: str
    passenger_count: int = 1
    travel_class: str = "II" # "II" or "FC"
    user_latitude: Optional[float] = None
    user_longitude: Optional[float] = None

class PlatformTicketCreate(BaseModel):
    station: str
    passenger_count: int = 1

class SeasonTicketCreate(BaseModel):
    from_station: str
    to_station: str
    travel_class: str = "II"
    duration_type: str = "MONTHLY" # "MONTHLY" or "QUARTERLY"

class UnreservedTicketResponse(BaseModel):
    id: int
    ticket_ref: str
    ticket_type: str
    from_station: str
    to_station: Optional[str] = None
    passenger_count: int
    travel_class: str
    duration_type: Optional[str] = None
    fare: float
    validity_start: datetime
    validity_end: datetime
    qr_payload: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
