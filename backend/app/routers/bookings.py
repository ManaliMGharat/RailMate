import random
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.train import Train, Coach, Seat
from app.models.station import Station
from app.models.booking import Booking, BookingPassenger, Payment
from app.models.pnr import PNRRecord
from app.models.wallet import Wallet, WalletTransaction
from app.models.refund import Refund
from app.models.notification import Notification
from app.schemas.booking import (
    BookingCreateRequest, BookingResponse, BookingPassengerResponse,
    CancelBookingResponse
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])

def allocate_seats(db: Session, train_id: int, travel_class: str, passengers_count: int):
    # Find coaches for this train matching travel_class
    coaches = db.query(Coach).filter(
        Coach.train_id == train_id,
        Coach.coach_type == travel_class
    ).all()

    coach_code = coaches[0].coach_code if coaches else "B1"
    start_seat = random.randint(12, 54)
    berths = ["Lower", "Middle", "Upper", "Side Lower", "Side Upper", "Window", "Aisle"]

    allocations = []
    for i in range(passengers_count):
        seat_num = start_seat + i
        berth = berths[(seat_num - 1) % len(berths)]
        allocations.append((coach_code, seat_num, berth, "CNF"))

    return allocations

@router.post("", response_model=BookingResponse)
def create_booking(
    req: BookingCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    train = db.query(Train).filter(Train.id == req.train_id).first()
    if not train:
        raise HTTPException(status_code=404, detail="Train not found")

    # Canonical station code resolution
    from_st = None
    if req.source_station_code:
        from_st = db.query(Station).filter(Station.code.ilike(req.source_station_code.strip())).first()
    elif req.from_station_code:
        from_st = db.query(Station).filter(Station.code.ilike(req.from_station_code.strip())).first()
    elif req.from_station_id:
        from_st = db.query(Station).filter(Station.id == req.from_station_id).first()

    to_st = None
    if req.destination_station_code:
        to_st = db.query(Station).filter(Station.code.ilike(req.destination_station_code.strip())).first()
    elif req.to_station_code:
        to_st = db.query(Station).filter(Station.code.ilike(req.to_station_code.strip())).first()
    elif req.to_station_id:
        to_st = db.query(Station).filter(Station.id == req.to_station_id).first()

    if not from_st or not to_st:
        raise HTTPException(status_code=404, detail="Station not found")

    # Multipliers for fare
    class_rates = {"1A": 3200, "2A": 2100, "3A": 1450, "3E": 1250, "SL": 550, "CC": 750, "EC": 1600, "2S": 220}
    single_fare = class_rates.get(req.travel_class, 1000)
    pax_count = len(req.passengers)
    base_fare = single_fare * pax_count
    taxes = round(base_fare * 0.05 + 30, 2)
    total_amount = base_fare + taxes

    # If wallet payment, check and deduct balance
    if req.payment_method == "WALLET":
        wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
        if not wallet or wallet.balance < total_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient R-Wallet balance (₹{wallet.balance if wallet else 0}). Please top-up or choose UPI/Card."
            )
        wallet.balance -= total_amount
        wallet_txn = WalletTransaction(
            wallet_id=wallet.id,
            user_id=current_user.id,
            transaction_type="DEBIT",
            amount=total_amount,
            reference=f"TXN-WLT-{random.randint(100000, 999999)}",
            description=f"Ticket Booking on {train.number} ({train.name})"
        )
        db.add(wallet_txn)

    # Generate 10 digit PNR
    pnr_num = f"{random.randint(2000000000, 8999999999)}"
    booking_ref = f"BK-{uuid.uuid4().hex[:6].upper()}"
    qr_data = f"RAILONE:PNR:{pnr_num}:{train.number}:{req.journey_date}:{req.travel_class}:CONFIRMED"

    booking = Booking(
        booking_ref=booking_ref,
        user_id=current_user.id,
        train_id=train.id,
        from_station_id=from_st.id,
        to_station_id=to_st.id,
        journey_date=req.journey_date,
        travel_class=req.travel_class,
        quota=req.quota or "General",
        status="CONFIRMED",
        pnr_number=pnr_num,
        base_fare=base_fare,
        taxes=taxes,
        total_amount=total_amount,
        qr_code=qr_data
    )
    db.add(booking)
    db.flush()

    allocations = allocate_seats(db, train.id, req.travel_class, pax_count)
    passengers_resp = []
    pnr_passengers_list = []

    for idx, p_in in enumerate(req.passengers):
        coach, seat, berth, st = allocations[idx]
        bp = BookingPassenger(
            booking_id=booking.id,
            name=p_in.name,
            age=p_in.age,
            gender=p_in.gender,
            berth_preference=p_in.berth_preference or "No Preference",
            allocated_coach=coach,
            allocated_seat=seat,
            allocated_berth_type=berth,
            status=st
        )
        db.add(bp)
        db.flush()
        passengers_resp.append(bp)
        pnr_passengers_list.append({
            "passenger": p_in.name,
            "booking_status": "CNF",
            "current_status": f"CNF {coach}-{seat} ({berth})"
        })

    # Record Payment
    payment = Payment(
        booking_id=booking.id,
        user_id=current_user.id,
        amount=total_amount,
        payment_method=req.payment_method,
        transaction_ref=f"TXN-{req.payment_method}-{random.randint(10000000, 99999999)}",
        status="SUCCESS"
    )
    db.add(payment)

    # Sync to PNR records table for lookup
    import json
    pnr_rec = PNRRecord(
        pnr_number=pnr_num,
        booking_id=booking.id,
        train_number=train.number,
        train_name=train.name,
        journey_date=req.journey_date,
        from_station=f"{from_st.name} ({from_st.code})",
        to_station=f"{to_st.name} ({to_st.code})",
        boarding_point=from_st.name,
        travel_class=req.travel_class,
        quota=req.quota or "General",
        chart_status="CHART NOT PREPARED",
        passengers_json=json.dumps(pnr_passengers_list)
    )
    db.add(pnr_rec)

    # Add confirmation notification
    notif = Notification(
        user_id=current_user.id,
        title=f"Booking Confirmed: {train.number} ({train.name})",
        message=f"PNR: {pnr_num}. Journey from {from_st.name} to {to_st.name} on {req.journey_date}.",
        category="booking",
        link_url=f"/ticket/{booking.id}"
    )
    db.add(notif)

    db.commit()
    db.refresh(booking)

    return BookingResponse(
        id=booking.id,
        booking_ref=booking.booking_ref,
        pnr_number=booking.pnr_number,
        train_number=train.number,
        train_name=train.name,
        from_station_code=from_st.code,
        from_station_name=from_st.name,
        to_station_code=to_st.code,
        to_station_name=to_st.name,
        journey_date=booking.journey_date,
        travel_class=booking.travel_class,
        quota=booking.quota,
        status=booking.status,
        base_fare=booking.base_fare,
        taxes=booking.taxes,
        total_amount=booking.total_amount,
        qr_code=booking.qr_code,
        created_at=booking.created_at,
        passengers=passengers_resp,
        payment_method=payment.payment_method,
        payment_status=payment.status
    )

@router.get("", response_model=List[BookingResponse])
def get_user_bookings(
    status_filter: Optional[str] = Query(None), # "upcoming", "completed", "cancelled"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Booking).filter(Booking.user_id == current_user.id)
    
    if status_filter == "upcoming":
        query = query.filter(Booking.status == "CONFIRMED")
    elif status_filter == "completed":
        query = query.filter(Booking.status == "COMPLETED")
    elif status_filter == "cancelled":
        query = query.filter(Booking.status == "CANCELLED")

    bookings = query.order_by(Booking.created_at.desc()).all()

    results = []
    for b in bookings:
        results.append(BookingResponse(
            id=b.id,
            booking_ref=b.booking_ref,
            pnr_number=b.pnr_number,
            train_number=b.train.number,
            train_name=b.train.name,
            from_station_code=b.from_station.code,
            from_station_name=b.from_station.name,
            to_station_code=b.to_station.code,
            to_station_name=b.to_station.name,
            journey_date=b.journey_date,
            travel_class=b.travel_class,
            quota=b.quota,
            status=b.status,
            base_fare=b.base_fare,
            taxes=b.taxes,
            total_amount=b.total_amount,
            qr_code=b.qr_code,
            created_at=b.created_at,
            passengers=b.passengers,
            payment_method=b.payment.payment_method if b.payment else "UPI",
            payment_status=b.payment.status if b.payment else "SUCCESS"
        ))

    return results

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking_detail(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    b = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()

    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    return BookingResponse(
        id=b.id,
        booking_ref=b.booking_ref,
        pnr_number=b.pnr_number,
        train_number=b.train.number,
        train_name=b.train.name,
        from_station_code=b.from_station.code,
        from_station_name=b.from_station.name,
        to_station_code=b.to_station.code,
        to_station_name=b.to_station.name,
        journey_date=b.journey_date,
        travel_class=b.travel_class,
        quota=b.quota,
        status=b.status,
        base_fare=b.base_fare,
        taxes=b.taxes,
        total_amount=b.total_amount,
        qr_code=b.qr_code,
        created_at=b.created_at,
        passengers=b.passengers,
        payment_method=b.payment.payment_method if b.payment else "UPI",
        payment_status=b.payment.status if b.payment else "SUCCESS"
    )

@router.post("/{booking_id}/cancel", response_model=CancelBookingResponse)
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    b = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()

    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    if b.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Ticket is already cancelled")

    # Compute cancellation charges according to railway rules:
    # Cancellation > 48h before journey: Flat charges (1A/EC: 240, 2A: 200, 3A/CC: 180, SL: 120, 2S: 60)
    flat_charges = {"1A": 240.0, "EC": 240.0, "2A": 200.0, "3A": 180.0, "3E": 180.0, "CC": 180.0, "SL": 120.0, "2S": 60.0}
    per_pax_charge = flat_charges.get(b.travel_class, 150.0)
    total_cancellation_charge = min(b.total_amount, per_pax_charge * max(1, len(b.passengers)))
    refund_amount = max(0.0, b.total_amount - total_cancellation_charge)

    b.status = "CANCELLED"
    for p in b.passengers:
        p.status = "CAN"

    # Create Refund Record
    refund_ref = f"RF-{uuid.uuid4().hex[:6].upper()}"
    refund = Refund(
        refund_ref=refund_ref,
        booking_id=b.id,
        user_id=current_user.id,
        original_amount=b.total_amount,
        cancellation_charge=total_cancellation_charge,
        refund_amount=refund_amount,
        reason="User requested cancellation",
        status="APPROVED"
    )
    db.add(refund)

    # Automatically credit refund into user's R-Wallet for instant demo satisfaction
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if wallet:
        wallet.balance += refund_amount
        wallet_txn = WalletTransaction(
            wallet_id=wallet.id,
            user_id=current_user.id,
            transaction_type="REFUND",
            amount=refund_amount,
            reference=f"TXN-REF-{refund.refund_ref}",
            description=f"Refund for Ticket {b.pnr_number} ({b.train.name})"
        )
        db.add(wallet_txn)

    # Update PNR record status
    pnr_rec = db.query(PNRRecord).filter(PNRRecord.pnr_number == b.pnr_number).first()
    if pnr_rec:
        pnr_rec.chart_status = "CHART PREPARED"
        import json
        pnr_rec.passengers_json = json.dumps([{"passenger": p.name, "booking_status": "CAN", "current_status": "CANCELLED"} for p in b.passengers])

    # Add notification
    notif = Notification(
        user_id=current_user.id,
        title=f"Booking Cancelled: PNR {b.pnr_number}",
        message=f"Refund of ₹{refund_amount} credited to your R-Wallet after cancellation fee of ₹{total_cancellation_charge}.",
        category="refund",
        link_url=f"/refunds"
    )
    db.add(notif)

    db.commit()

    return CancelBookingResponse(
        booking_id=b.id,
        booking_ref=b.booking_ref,
        pnr_number=b.pnr_number,
        status="CANCELLED",
        original_amount=b.total_amount,
        cancellation_charge=total_cancellation_charge,
        refund_amount=refund_amount,
        message=f"Ticket cancelled successfully. ₹{refund_amount} has been refunded to your R-Wallet."
    )
