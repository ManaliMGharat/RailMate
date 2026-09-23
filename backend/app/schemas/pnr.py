from typing import List, Any
from pydantic import BaseModel

class PNRPassengerItem(BaseModel):
    passenger: str
    booking_status: str
    current_status: str

class PNRStatusResponse(BaseModel):
    pnr_number: str
    train_number: str
    train_name: str
    journey_date: str
    from_station: str
    to_station: str
    boarding_point: str
    travel_class: str
    quota: str
    chart_status: str
    passengers: List[PNRPassengerItem]
    demo_notice: str = "Demo data — not live railway information"
