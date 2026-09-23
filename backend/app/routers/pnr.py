import json
import random
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.pnr import PNRRecord
from app.models.booking import Booking
from app.schemas.pnr import PNRStatusResponse, PNRPassengerItem

router = APIRouter(prefix="/pnr", tags=["PNR Status"])

@router.get("/samples")
def get_sample_pnrs(db: Session = Depends(get_db)):
    records = db.query(PNRRecord).limit(6).all()
    return [
        {
            "pnr_number": r.pnr_number,
            "train_number": r.train_number,
            "train_name": r.train_name,
            "route": f"{r.from_station.split('(')[0]} ➔ {r.to_station.split('(')[0]}",
            "class": r.travel_class
        }
        for r in records
    ]

@router.get("/{pnr_number}", response_model=PNRStatusResponse)
def get_pnr_status(pnr_number: str, db: Session = Depends(get_db)):
    cleaned_pnr = pnr_number.strip().replace(" ", "").replace("-", "")
    
    # Check seeded PNR records
    record = db.query(PNRRecord).filter(PNRRecord.pnr_number == cleaned_pnr).first()
    
    if record:
        raw_passengers = json.loads(record.passengers_json)
        passenger_items = [
            PNRPassengerItem(
                passenger=p.get("passenger", "Passenger"),
                booking_status=p.get("booking_status", "CNF"),
                current_status=p.get("current_status", "CNF")
            )
            for p in raw_passengers
        ]

        return PNRStatusResponse(
            pnr_number=record.pnr_number,
            train_number=record.train_number,
            train_name=record.train_name,
            journey_date=record.journey_date,
            from_station=record.from_station,
            to_station=record.to_station,
            boarding_point=record.boarding_point,
            travel_class=record.travel_class,
            quota=record.quota,
            chart_status=record.chart_status,
            passengers=passenger_items,
            demo_notice="Demo data — not live railway information"
        )

    # Check in active bookings
    booking = db.query(Booking).filter(Booking.pnr_number == cleaned_pnr).first()
    if booking:
        passenger_items = [
            PNRPassengerItem(
                passenger=bp.name,
                booking_status=bp.status,
                current_status=f"{bp.status} {bp.allocated_coach}-{bp.allocated_seat} ({bp.allocated_berth_type})" if bp.status == "CNF" else bp.status
            )
            for bp in booking.passengers
        ]
        return PNRStatusResponse(
            pnr_number=booking.pnr_number,
            train_number=booking.train.number,
            train_name=booking.train.name,
            journey_date=booking.journey_date,
            from_station=f"{booking.from_station.name} ({booking.from_station.code})",
            to_station=f"{booking.to_station.name} ({booking.to_station.code})",
            boarding_point=booking.from_station.name,
            travel_class=booking.travel_class,
            quota=booking.quota,
            chart_status="CHART NOT PREPARED" if booking.status == "CONFIRMED" else "CANCELLED",
            passengers=passenger_items,
            demo_notice="Demo data — not live railway information"
        )

    # If it's a 10-digit number but not in DB, generate realistic simulation
    if len(cleaned_pnr) == 10 and cleaned_pnr.isdigit():
        return PNRStatusResponse(
            pnr_number=cleaned_pnr,
            train_number="12951",
            train_name="Mumbai Rajdhani Express",
            journey_date="Tomorrow",
            from_station="Mumbai Central (MMCT)",
            to_station="New Delhi (NDLS)",
            boarding_point="Mumbai Central",
            travel_class="3A",
            quota="General",
            chart_status="CHART NOT PREPARED",
            passengers=[
                PNRPassengerItem(passenger="Passenger 1", booking_status="CNF", current_status="CNF B2-34 (Lower)"),
                PNRPassengerItem(passenger="Passenger 2", booking_status="CNF", current_status="CNF B2-35 (Middle)")
            ],
            demo_notice="Demo data — not live railway information"
        )

    raise HTTPException(status_code=404, detail="Invalid PNR number. Please enter a valid 10-digit PNR.")
