from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class PassengerInput(BaseModel):
    name: str
    age: int
    gender: str
    berth_preference: Optional[str] = "No Preference"

class BookingPassengerResponse(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    berth_preference: Optional[str]
    allocated_coach: Optional[str]
    allocated_seat: Optional[int]
    allocated_berth_type: Optional[str]
    status: str

    class Config:
        from_attributes = True

class BookingCreateRequest(BaseModel):
    train_id: int
    from_station_id: int
    to_station_id: int
    journey_date: str # "YYYY-MM-DD"
    travel_class: str # "3A", "SL", etc.
    quota: Optional[str] = "General"
    passengers: List[PassengerInput]
    payment_method: str # "UPI", "DEBIT_CARD", "CREDIT_CARD", "NET_BANKING", "WALLET"

class BookingResponse(BaseModel):
    id: int
    booking_ref: str
    pnr_number: str
    train_number: str
    train_name: str
    from_station_code: str
    from_station_name: str
    to_station_code: str
    to_station_name: str
    journey_date: str
    travel_class: str
    quota: str
    status: str
    base_fare: float
    taxes: float
    total_amount: float
    qr_code: Optional[str]
    created_at: datetime
    passengers: List[BookingPassengerResponse]
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None

class CancelBookingResponse(BaseModel):
    booking_id: int
    booking_ref: str
    pnr_number: str
    status: str
    original_amount: float
    cancellation_charge: float
    refund_amount: float
    message: str
