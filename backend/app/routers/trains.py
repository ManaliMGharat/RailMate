import math
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.station import Station
from app.models.train import Train, TrainSchedule, Coach
from app.schemas.train import (
    TrainResponse, TrainDetailResponse, ScheduleStopResponse,
    ClassAvailability, CoachPositionResponse, CoachPositionItem,
    RunningStatusResponse, TimelineStop
)

router = APIRouter(prefix="/trains", tags=["Trains"])

def get_class_pricing_and_availability(train: Train, quota: str = "General") -> List[ClassAvailability]:
    class_multipliers = {
        "1A": (4.5, "1st AC", 8),
        "2A": (2.8, "2nd AC", 16),
        "3A": (1.8, "3rd AC", 48),
        "3E": (1.6, "3rd AC Economy", 36),
        "SL": (1.0, "Sleeper", 96),
        "CC": (1.4, "AC Chair Car", 64),
        "EC": (2.9, "Exec Chair Car", 14),
        "2S": (0.4, "Second Sitting", 120),
    }

    base_rate_per_hour = 65.0
    results = []

    available_codes = [c.strip() for c in train.available_classes.split(",") if c.strip()]
    for code in available_codes:
        mult, cname, base_seats = class_multipliers.get(code, (1.0, code, 50))
        fare = round(train.duration_hours * base_rate_per_hour * mult + 40, -1)
        if quota == "Tatkal":
            fare += 150.0

        # Deterministic simulation based on train id + class
        hash_val = (train.id * 17 + len(code) * 7) % 10
        if hash_val < 6:
            seats_left = max(4, base_seats - (hash_val * 4))
            status_text = f"AVAILABLE {seats_left}"
            status_type = "AVAILABLE"
            prob = "High (98%)"
        elif hash_val < 8:
            seats_left = 3
            status_text = f"RAC {hash_val - 3}"
            status_type = "RAC"
            prob = "High (82%)"
        else:
            seats_left = 0
            status_text = f"WL {hash_val * 2}"
            status_type = "WL"
            prob = "Medium (64%)"

        results.append(ClassAvailability(
            class_code=code,
            class_name=cname,
            fare=fare,
            status=status_text,
            status_type=status_type,
            seats_left=seats_left,
            confirm_probability=prob
        ))

    return results

@router.get("/search")
def search_trains(
    from_station: str = Query(...), # code or id
    to_station: str = Query(...),   # code or id
    date: Optional[str] = Query(None),
    class_type: Optional[str] = Query(None),
    quota: Optional[str] = Query("General"),
    train_type: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("departure"), # "departure", "duration"
    db: Session = Depends(get_db)
):
    src_station = db.query(Station).filter(
        (Station.code == from_station.upper()) | (Station.id == (int(from_station) if from_station.isdigit() else -1))
    ).first()
    dst_station = db.query(Station).filter(
        (Station.code == to_station.upper()) | (Station.id == (int(to_station) if to_station.isdigit() else -1))
    ).first()

    if not src_station or not dst_station:
        # Fallback to general list of trains if station not specified or not found
        trains = db.query(Train).limit(10).all()
    else:
        # Find trains that have schedules stopping at both stations with src_sequence < dst_sequence
        src_schedules = db.query(TrainSchedule).filter(TrainSchedule.station_id == src_station.id).subquery()
        dst_schedules = db.query(TrainSchedule).filter(TrainSchedule.station_id == dst_station.id).subquery()

        query = db.query(Train).join(
            src_schedules, Train.id == src_schedules.c.train_id
        ).join(
            dst_schedules, Train.id == dst_schedules.c.train_id
        ).filter(
            src_schedules.c.stop_sequence < dst_schedules.c.stop_sequence
        )

        if train_type:
            query = query.filter(Train.train_type.ilike(f"%{train_type}%"))

        trains = query.all()

        # If direct train count is low in demo mode, provide direct + connected sample trains
        if len(trains) == 0:
            trains = db.query(Train).limit(8).all()

    formatted_trains = []
    for t in trains:
        classes = get_class_pricing_and_availability(t, quota or "General")
        if class_type and not any(c.class_code == class_type for c in classes):
            continue
        
        # Calculate dynamic departure and arrival based on search stations if intermediate
        src_sch = next((s for s in t.schedules if src_station and s.station_id == src_station.id), None)
        dst_sch = next((s for s in t.schedules if dst_station and s.station_id == dst_station.id), None)

        dep_time = src_sch.departure_time if src_sch else t.departure_time
        arr_time = dst_sch.arrival_time if dst_sch else t.arrival_time

        formatted_trains.append({
            "id": t.id,
            "number": t.number,
            "name": t.name,
            "train_type": t.train_type,
            "source_station": {
                "id": t.source_station.id,
                "code": t.source_station.code,
                "name": t.source_station.name,
                "city": t.source_station.city,
                "state": t.source_station.state,
                "platform_count": t.source_station.platform_count
            },
            "destination_station": {
                "id": t.destination_station.id,
                "code": t.destination_station.code,
                "name": t.destination_station.name,
                "city": t.destination_station.city,
                "state": t.destination_station.state,
                "platform_count": t.destination_station.platform_count
            },
            "departure_time": dep_time,
            "arrival_time": arr_time,
            "duration_hours": t.duration_hours,
            "running_days": t.running_days,
            "available_classes": t.available_classes,
            "classes": classes
        })

    if sort_by == "duration":
        formatted_trains.sort(key=lambda x: x["duration_hours"])
    else:
        formatted_trains.sort(key=lambda x: x["departure_time"])

    return {
        "count": len(formatted_trains),
        "from_station": src_station.name if src_station else from_station,
        "to_station": dst_station.name if dst_station else to_station,
        "journey_date": date or datetime.now().strftime("%Y-%m-%d"),
        "quota": quota or "General",
        "trains": formatted_trains
    }

@router.get("/{train_id_or_number}", response_model=TrainDetailResponse)
def get_train_detail(train_id_or_number: str, db: Session = Depends(get_db)):
    train = db.query(Train).filter(
        (Train.number == train_id_or_number) |
        (Train.id == (int(train_id_or_number) if train_id_or_number.isdigit() else -1))
    ).first()

    if not train:
        raise HTTPException(status_code=404, detail="Train not found")

    stops = []
    for s in train.schedules:
        stops.append(ScheduleStopResponse(
            id=s.id,
            stop_sequence=s.stop_sequence,
            station_code=s.station.code,
            station_name=s.station.name,
            city=s.station.city,
            arrival_time=s.arrival_time,
            departure_time=s.departure_time,
            halt_minutes=s.halt_minutes,
            day_number=s.day_number,
            distance_km=s.distance_km,
            platform_number=s.platform_number
        ))

    classes = get_class_pricing_and_availability(train)

    return TrainDetailResponse(
        id=train.id,
        number=train.number,
        name=train.name,
        train_type=train.train_type,
        source_station=train.source_station,
        destination_station=train.destination_station,
        departure_time=train.departure_time,
        arrival_time=train.arrival_time,
        duration_hours=train.duration_hours,
        running_days=train.running_days,
        available_classes=train.available_classes,
        classes=classes,
        schedules=stops
    )

@router.get("/{train_id_or_number}/schedule")
def get_train_schedule(train_id_or_number: str, db: Session = Depends(get_db)):
    train = db.query(Train).filter(
        (Train.number == train_id_or_number) |
        (Train.id == (int(train_id_or_number) if train_id_or_number.isdigit() else -1))
    ).first()

    if not train:
        raise HTTPException(status_code=404, detail="Train not found")

    stops = []
    for s in train.schedules:
        stops.append({
            "stop_sequence": s.stop_sequence,
            "station_code": s.station.code,
            "station_name": s.station.name,
            "city": s.station.city,
            "arrival_time": s.arrival_time,
            "departure_time": s.departure_time,
            "halt_minutes": s.halt_minutes,
            "day_number": s.day_number,
            "distance_km": s.distance_km,
            "platform_number": s.platform_number
        })

    return {
        "train_number": train.number,
        "train_name": train.name,
        "train_type": train.train_type,
        "running_days": train.running_days,
        "stops": stops
    }

@router.get("/{train_id_or_number}/coach-position", response_model=CoachPositionResponse)
def get_coach_position(
    train_id_or_number: str,
    station_code: Optional[str] = "MMCT",
    db: Session = Depends(get_db)
):
    train = db.query(Train).filter(
        (Train.number == train_id_or_number) |
        (Train.id == (int(train_id_or_number) if train_id_or_number.isdigit() else -1))
    ).first()

    if not train:
        raise HTTPException(status_code=404, detail="Train not found")

    st = db.query(Station).filter(Station.code.ilike(station_code)).first() or train.source_station

    coaches = db.query(Coach).filter(Coach.train_id == train.id).order_by(Coach.sequence_order).all()

    items = [
        CoachPositionItem(
            coach_code=c.coach_code,
            coach_type=c.coach_type,
            sequence_order=c.sequence_order,
            platform_zone=c.platform_zone
        ) for c in coaches
    ]

    return CoachPositionResponse(
        train_number=train.number,
        train_name=train.name,
        station_code=st.code,
        station_name=st.name,
        total_coaches=len(items),
        platform_number=3,
        coaches=items,
        demo_notice="Demo data — simulated platform coach composition"
    )

@router.get("/{train_id_or_number}/running-status", response_model=RunningStatusResponse)
def get_running_status(train_id_or_number: str, db: Session = Depends(get_db)):
    train = db.query(Train).filter(
        (Train.number == train_id_or_number) |
        (Train.id == (int(train_id_or_number) if train_id_or_number.isdigit() else -1))
    ).first()

    if not train:
        raise HTTPException(status_code=404, detail="Train not found")

    schedules = train.schedules
    if not schedules:
        raise HTTPException(status_code=400, detail="Train has no schedule data")

    # Simulate realistic progress along the route
    total_stops = len(schedules)
    current_idx = max(0, min(1, total_stops - 1)) if total_stops > 1 else 0
    next_idx = min(current_idx + 1, total_stops - 1)

    timeline = []
    delay = 8  # 8 mins delay for realistic simulation
    total_dist = schedules[-1].distance_km if schedules[-1].distance_km > 0 else 1000

    for i, s in enumerate(schedules):
        is_passed = (i < current_idx)
        is_current = (i == current_idx)
        
        timeline.append(TimelineStop(
            station_code=s.station.code,
            station_name=s.station.name,
            scheduled_arrival=s.arrival_time,
            scheduled_departure=s.departure_time,
            actual_arrival=s.arrival_time if not is_current else f"{s.arrival_time} (+{delay}m)",
            actual_departure=s.departure_time,
            delay_minutes=delay if (is_current or is_passed) else 0,
            is_passed=is_passed,
            is_current=is_current,
            platform=s.platform_number,
            distance_km=s.distance_km
        ))

    curr_stop = schedules[current_idx]
    next_stop = schedules[next_idx]
    dist_covered = curr_stop.distance_km

    return RunningStatusResponse(
        train_number=train.number,
        train_name=train.name,
        current_station=curr_stop.station.code,
        current_station_name=curr_stop.station.name,
        next_station=next_stop.station.code,
        next_station_name=next_stop.station.name,
        status_summary=f"Running {delay} min late • Passed {curr_stop.station.name}",
        delay_minutes=delay,
        distance_covered_km=dist_covered,
        total_distance_km=total_dist,
        progress_percentage=round((dist_covered / max(1, total_dist)) * 100, 1),
        last_updated="Just now (GPS Simulated)",
        timeline=timeline,
        demo_notice="Demo data — not live railway information"
    )
