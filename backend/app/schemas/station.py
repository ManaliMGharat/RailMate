from typing import Optional
from pydantic import BaseModel

class StationResponse(BaseModel):
    id: int
    code: str
    name: str
    city: str
    state: str
    zone: Optional[str] = None
    platform_count: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True
