import uuid
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.ticket import UnreservedTicket
from app.models.wallet import Wallet, WalletTransaction
from app.models.notification import Notification
from app.schemas.ticket import (
    JourneyTicketCreate, PlatformTicketCreate, SeasonTicketCreate,
    UnreservedTicketResponse
)

router = APIRouter(prefix="/tickets", tags=["Unreserved Tickets"])

@router.post("/unreserved", response_model=UnreservedTicketResponse)
def book_journey_ticket(
    req: JourneyTicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.from_station.strip().lower() == req.to_station.strip().lower():
        raise HTTPException(status_code=400, detail="Source and Destination stations cannot be identical.")

    # Calculate fare
    per_pax = 20.0 if req.travel_class == "II" else 85.0
    fare = per_pax * req.passenger_count

    # Check and deduct wallet if available
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if wallet and wallet.balance >= fare:
        wallet.balance -= fare
        txn = WalletTransaction(
            wallet_id=wallet.id,
            user_id=current_user.id,
            transaction_type="DEBIT",
            amount=fare,
            reference=f"TXN-UTS-{uuid.uuid4().hex[:6].upper()}",
            description=f"UTS Ticket {req.from_station} to {req.to_station}"
        )
        db.add(txn)

    ticket_ref = f"UTS-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.utcnow()
    valid_until = now + timedelta(hours=3) # Valid for 3 hours
    qr_payload = f"UTS:JOURNEY:{ticket_ref}:{req.from_station}-{req.to_station}:PAX{req.passenger_count}:{req.travel_class}"

    ticket = UnreservedTicket(
        ticket_ref=ticket_ref,
        user_id=current_user.id,
        ticket_type="JOURNEY",
        from_station=req.from_station,
        to_station=req.to_station,
        passenger_count=req.passenger_count,
        travel_class=req.travel_class,
        fare=fare,
        validity_start=now,
        validity_end=valid_until,
        qr_payload=qr_payload,
        status="ACTIVE"
    )
    db.add(ticket)

    notif = Notification(
        user_id=current_user.id,
        title="UTS Journey Ticket Booked",
        message=f"{req.from_station} to {req.to_station} ({req.passenger_count} Pax). Valid for 3 hours.",
        category="booking"
    )
    db.add(notif)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.post("/platform", response_model=UnreservedTicketResponse)
def book_platform_ticket(
    req: PlatformTicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fare = 10.0 * req.passenger_count

    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if wallet and wallet.balance >= fare:
        wallet.balance -= fare
        txn = WalletTransaction(
            wallet_id=wallet.id,
            user_id=current_user.id,
            transaction_type="DEBIT",
            amount=fare,
            reference=f"TXN-PLT-{uuid.uuid4().hex[:6].upper()}",
            description=f"Platform Ticket at {req.station}"
        )
        db.add(txn)

    ticket_ref = f"PLT-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.utcnow()
    valid_until = now + timedelta(hours=2) # Platform ticket valid for 2 hours
    qr_payload = f"UTS:PLATFORM:{ticket_ref}:{req.station}:PAX{req.passenger_count}"

    ticket = UnreservedTicket(
        ticket_ref=ticket_ref,
        user_id=current_user.id,
        ticket_type="PLATFORM",
        from_station=req.station,
        to_station=None,
        passenger_count=req.passenger_count,
        travel_class="II",
        fare=fare,
        validity_start=now,
        validity_end=valid_until,
        qr_payload=qr_payload,
        status="ACTIVE"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.post("/season", response_model=UnreservedTicketResponse)
def book_season_ticket(
    req: SeasonTicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.from_station.strip().lower() == req.to_station.strip().lower():
        raise HTTPException(status_code=400, detail="Source and Destination cannot be identical.")

    months = 1 if req.duration_type == "MONTHLY" else 3
    base_month = 280.0 if req.travel_class == "II" else 840.0
    fare = base_month * months

    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if wallet and wallet.balance >= fare:
        wallet.balance -= fare
        txn = WalletTransaction(
            wallet_id=wallet.id,
            user_id=current_user.id,
            transaction_type="DEBIT",
            amount=fare,
            reference=f"TXN-SEA-{uuid.uuid4().hex[:6].upper()}",
            description=f"Season Pass ({req.duration_type}) {req.from_station} to {req.to_station}"
        )
        db.add(txn)

    ticket_ref = f"SEA-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.utcnow()
    valid_until = now + timedelta(days=30 * months)
    qr_payload = f"UTS:SEASON:{ticket_ref}:{req.from_station}-{req.to_station}:{req.duration_type}:{req.travel_class}"

    ticket = UnreservedTicket(
        ticket_ref=ticket_ref,
        user_id=current_user.id,
        ticket_type="SEASON",
        from_station=req.from_station,
        to_station=req.to_station,
        passenger_count=1,
        travel_class=req.travel_class,
        duration_type=req.duration_type,
        fare=fare,
        validity_start=now,
        validity_end=valid_until,
        qr_payload=qr_payload,
        status="ACTIVE"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.get("/my-tickets", response_model=List[UnreservedTicketResponse])
def get_my_unreserved_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(UnreservedTicket).filter(
        UnreservedTicket.user_id == current_user.id
    ).order_by(UnreservedTicket.created_at.desc()).all()
