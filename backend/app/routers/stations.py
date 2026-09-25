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
    q: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    if not q or not q.strip():
        # Return popular major stations when query is blank
        return db.query(Station).filter(Station.is_active == True).order_by(
            Station.is_major.desc(),
            Station.platform_count.desc(),
            Station.name.asc()
        ).offset(offset).limit(limit).all()

    query_str = q.strip().lower()
    
    # Query candidate stations matching code, name, city, state, zone, district, corridors, or aliases
    term = f"%{query_str}%"
    candidates = db.query(Station).filter(
        Station.is_active == True,
        (
            Station.code.ilike(term) |
            Station.name.ilike(term) |
            Station.city.ilike(term) |
            Station.state.ilike(term) |
            Station.zone.ilike(term) |
            Station.district.ilike(term) |
            Station.corridors.ilike(term) |
            Station.search_aliases.ilike(term)
        )
    ).all()

    def score_station(s: Station) -> int:
        code = s.code.lower()
        name = s.name.lower()
        city = s.city.lower()
        aliases_list = [a.strip().lower() for a in (s.search_aliases or "").split(",") if a.strip()]

        score = 0
        if code == query_str:
            score += 1000
        elif code.startswith(query_str):
            score += 800 - len(code)
        elif name == query_str:
            score += 700
        elif any(a == query_str for a in aliases_list):
            score += 650
        elif name.startswith(query_str):
            score += 600
        elif any(a.startswith(query_str) for a in aliases_list):
            score += 550
        elif city == query_str:
            score += 500
        elif city.startswith(query_str):
            score += 450
        elif query_str in code:
            score += 400
        elif query_str in name:
            score += 300
        elif any(query_str in a for a in aliases_list):
            score += 250
        elif s.district and query_str in s.district.lower():
            score += 220
        elif s.corridors and query_str in s.corridors.lower():
            score += 210
        elif s.state and query_str in s.state.lower():
            score += 200
        elif s.zone and query_str in s.zone.lower():
            score += 180
        elif query_str in city:
            score += 150

        # Prioritize major terminals and junctions on ties
        if s.is_major:
            score += 20
        if s.is_junction:
            score += 10
        return score

    scored = [(score_station(s), s) for s in candidates]
    scored = [item for item in scored if item[0] > 0]
    scored.sort(key=lambda x: x[0], reverse=True)

    results = [s for _, s in scored]
    return results[offset : offset + limit]

@router.get("/popular", response_model=List[StationResponse])
def get_popular_stations(
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db)
):
    # Preferred order of major junctions
    priority_codes = ["CSMT", "NDLS", "KYN", "PUNE", "MMCT", "HWH", "MAS", "SBC", "ADI", "BZA", "KOTA", "GHY"]
    stations_map = {
        s.code: s for s in db.query(Station).filter(Station.code.in_(priority_codes)).all()
    }
    
    result = []
    for code in priority_codes:
        if code in stations_map:
            result.append(stations_map[code])
            
    # If not enough, fill with other major stations
    if len(result) < limit:
        existing_ids = {s.id for s in result}
        additional = db.query(Station).filter(
            Station.is_major == True,
            Station.is_active == True,
            ~Station.id.in_(existing_ids)
        ).order_by(Station.platform_count.desc()).limit(limit - len(result)).all()
        result.extend(additional)

    return result[:limit]

@router.get("/recent", response_model=List[StationResponse])
def get_recent_stations_fallback(
    limit: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db)
):
    # Sensible fallback for recent stations
    fallback_codes = ["CSMT", "KYN", "PUNE", "NDLS", "MMCT", "ADI"]
    stations_map = {
        s.code: s for s in db.query(Station).filter(Station.code.in_(fallback_codes)).all()
    }
    return [stations_map[code] for code in fallback_codes if code in stations_map][:limit]

@router.get("/all", response_model=List[StationResponse])
def get_all_stations(db: Session = Depends(get_db)):
    return db.query(Station).filter(Station.is_active == True).order_by(Station.name).all()

@router.get("/{station_code}", response_model=StationResponse)
def get_station_by_code(
    station_code: str,
    db: Session = Depends(get_db)
):
    station = db.query(Station).filter(Station.code.ilike(station_code.strip())).first()
    if not station:
        raise HTTPException(status_code=404, detail=f"Station with code '{station_code}' not found")
    return station

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
