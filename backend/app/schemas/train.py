from typing import Optional, List
from pydantic import BaseModel
from app.schemas.station import StationResponse

class ScheduleStopResponse(BaseModel):
    id: int
    stop_sequence: int
    station_code: str
    station_name: str
    city: str
    arrival_time: str
    departure_time: str
    halt_minutes: int
    day_number: int
    distance_km: int
    platform_number: int

class ClassAvailability(BaseModel):
    class_code: str
    class_name: str
    fare: float
    status: str # "AVAILABLE 42", "RAC 5", "WL 12"
    status_type: str # "AVAILABLE", "RAC", "WL"
    seats_left: int
    confirm_probability: Optional[str] = "High"

class TrainResponse(BaseModel):
    id: int
    number: str
    name: str
    train_type: str
    source_station: StationResponse
    destination_station: StationResponse
    departure_time: str
    arrival_time: str
    duration_hours: float
    running_days: str
    available_classes: str
    classes: List[ClassAvailability] = []

    class Config:
        from_attributes = True

class TrainDetailResponse(TrainResponse):
    schedules: List[ScheduleStopResponse] = []

class CoachPositionItem(BaseModel):
    coach_code: str
    coach_type: str
    sequence_order: int
    platform_zone: str

class CoachPositionResponse(BaseModel):
    train_number: str
    train_name: str
    station_code: str
    station_name: str
    total_coaches: int
    platform_number: int
    coaches: List[CoachPositionItem]
    demo_notice: str = "Demo data — simulated platform coach composition"

class TimelineStop(BaseModel):
    station_code: str
    station_name: str
    scheduled_arrival: str
    scheduled_departure: str
    actual_arrival: str
    actual_departure: str
    delay_minutes: int
    is_passed: bool
    is_current: bool
    platform: int
    distance_km: int

class RunningStatusResponse(BaseModel):
    train_number: str
    train_name: str
    current_station: str
    current_station_name: str
    next_station: str
    next_station_name: str
    status_summary: str
    delay_minutes: int
    distance_covered_km: int
    total_distance_km: int
    progress_percentage: float
    last_updated: str
    timeline: List[TimelineStop]
    demo_notice: str = "Demo data — not live railway information"
