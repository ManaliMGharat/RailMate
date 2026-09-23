from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.station import Station
from app.models.train import Train, TrainSchedule
from app.schemas.station import StationResponse

router = APIRouter(prefix="/stations", tags=["Stations"])

@router.get("/search", response_model=List[StationResponse])
def search_stations(
    q: Optional[str] = Query(None, min_length=1),
    db: Session = Depends(get_db)
):
    if not q:
        return db.query(Station).limit(20).all()
    
    term = f"%{q}%"
    return db.query(Station).filter(
        (Station.code.ilike(term)) |
        (Station.name.ilike(term)) |
        (Station.city.ilike(term))
    ).limit(15).all()

@router.get("/all", response_model=List[StationResponse])
def get_all_stations(db: Session = Depends(get_db)):
    return db.query(Station).order_by(Station.name).all()

@router.get("/{station_code}/trains")
def get_live_station_board(
    station_code: str,
    filter_type: Optional[str] = "all", # "all", "arrivals", "departures"
    db: Session = Depends(get_db)
):
    station = db.query(Station).filter(Station.code.ilike(station_code)).first()
    if not station:
        raise HTTPException(status_code=404, detail=f"Station with code {station_code} not found")
    
    schedules = db.query(TrainSchedule).filter(TrainSchedule.station_id == station.id).all()
    
    arrivals = []
    departures = []

    for sch in schedules:
        train = sch.train
        if not train:
            continue
        
        is_origin = (sch.stop_sequence == 0)
        is_destination = (sch.train.destination_station_id == station.id)
        
        # Simulated delay in minutes for realism
        mock_delays = [0, 5, 0, 10, 0, 15, 2]
        delay = mock_delays[(sch.id * 3) % len(mock_delays)]
        
        entry = {
            "train_number": train.number,
            "train_name": train.name,
            "train_type": train.train_type,
            "source": train.source_station.name,
            "destination": train.destination_station.name,
            "scheduled_time": sch.arrival_time if not is_origin else sch.departure_time,
            "expected_time": sch.arrival_time if not is_origin else sch.departure_time,
            "platform": sch.platform_number,
            "delay_minutes": delay,
            "status": "On Time" if delay == 0 else f"Late by {delay} min"
        }

        if not is_origin:
            arrivals.append(entry)
        if not is_destination:
            departures.append(entry)

    return {
        "station": {
            "code": station.code,
            "name": station.name,
            "city": station.city,
            "platforms": station.platform_count
        },
        "arrivals": arrivals if filter_type in ["all", "arrivals"] else [],
        "departures": departures if filter_type in ["all", "departures"] else [],
        "demo_notice": "Demo data — not live railway information"
    }
