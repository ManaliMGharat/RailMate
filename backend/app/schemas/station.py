from typing import Optional, Any
from pydantic import BaseModel, model_validator

class StationResponse(BaseModel):
    id: int
    code: str
    name: str
    city: str
    state: str
    zone: Optional[str] = None
    railway_zone: Optional[str] = None
    division: Optional[str] = None
    district: Optional[str] = None
    station_type: Optional[str] = "SUBURBAN"
    corridors: Optional[str] = None
    search_aliases: Optional[str] = None
    is_active: bool = True
    is_junction: bool = False
    is_major: bool = False
    platform_count: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def populate_railway_zone(cls, data: Any) -> Any:
        if hasattr(data, "zone") and not hasattr(data, "railway_zone"):
            setattr(data, "railway_zone", data.zone)
        elif isinstance(data, dict):
            if "zone" in data and "railway_zone" not in data:
                data["railway_zone"] = data["zone"]
            elif "railway_zone" in data and "zone" not in data:
                data["zone"] = data["railway_zone"]
        return data

    class Config:
        from_attributes = True
