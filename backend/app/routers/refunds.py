import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.booking import Booking
from app.models.refund import Refund
from app.models.wallet import Wallet, WalletTransaction
from app.schemas.refund import (
    RefundCalculateRequest, RefundCalculateResponse, RefundCreateRequest,
    RefundResponse
)

router = APIRouter(prefix="/refunds", tags=["Refunds"])

@router.post("/calculate", response_model=RefundCalculateResponse)
def calculate_refund(
    req: RefundCalculateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(
        Booking.id == req.booking_id,
        Booking.user_id == current_user.id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    flat_charges = {"1A": 240.0, "EC": 240.0, "2A": 200.0, "3A": 180.0, "3E": 180.0, "CC": 180.0, "SL": 120.0, "2S": 60.0}
    pax_count = max(1, len(booking.passengers))
    cancellation_charge = min(booking.total_amount, flat_charges.get(booking.travel_class, 120.0) * pax_count)
    estimated_refund = max(0.0, booking.total_amount - cancellation_charge)

    return RefundCalculateResponse(
        booking_id=booking.id,
        booking_ref=booking.booking_ref,
        original_amount=booking.total_amount,
        cancellation_charge=cancellation_charge,
        estimated_refund=estimated_refund,
        policy_note="Per Railway Passenger Rules: Standard cancellation fee deducted based on class and timing prior to chart preparation."
    )

@router.post("/file", response_model=RefundResponse)
def file_refund(
    req: RefundCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(
        Booking.id == req.booking_id,
        Booking.user_id == current_user.id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    existing = db.query(Refund).filter(Refund.booking_id == booking.id).first()
    if existing:
        return existing

    flat_charges = {"1A": 240.0, "EC": 240.0, "2A": 200.0, "3A": 180.0, "3E": 180.0, "CC": 180.0, "SL": 120.0, "2S": 60.0}
    pax_count = max(1, len(booking.passengers))
    cancellation_charge = min(booking.total_amount, flat_charges.get(booking.travel_class, 120.0) * pax_count)
    refund_amount = max(0.0, booking.total_amount - cancellation_charge)

    refund = Refund(
        refund_ref=f"RF-{uuid.uuid4().hex[:6].upper()}",
        booking_id=booking.id,
        user_id=current_user.id,
        original_amount=booking.total_amount,
        cancellation_charge=cancellation_charge,
        refund_amount=refund_amount,
        reason=req.reason,
        status="APPROVED"
    )
    db.add(refund)

    # Credit to wallet
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if wallet:
        wallet.balance += refund_amount
        txn = WalletTransaction(
            wallet_id=wallet.id,
            user_id=current_user.id,
            transaction_type="REFUND",
            amount=refund_amount,
            reference=f"TXN-REF-{refund.refund_ref}",
            description=f"Refund credited for Booking {booking.pnr_number}"
        )
        db.add(txn)

    db.commit()
    db.refresh(refund)
    return refund

@router.get("", response_model=List[RefundResponse])
def get_user_refunds(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Refund).filter(
        Refund.user_id == current_user.id
    ).order_by(Refund.created_at.desc()).all()
