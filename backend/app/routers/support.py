import random
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.support import Complaint
from app.models.notification import Notification
from app.schemas.support import ComplaintCreate, ComplaintResponse

router = APIRouter(prefix="/support", tags=["Rail Support"])

@router.post("/complaints", response_model=ComplaintResponse)
def lodge_complaint(
    req: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ref_num = f"CMP-{random.randint(100000, 999999)}"
    
    complaint = Complaint(
        complaint_ref=ref_num,
        user_id=current_user.id,
        pnr=req.pnr,
        train_number=req.train_number,
        station_code=req.station_code,
        category=req.category,
        description=req.description,
        status="SUBMITTED",
        resolution_notes="Ticket registered. Assigned to duty supervisor for prompt action."
    )
    db.add(complaint)
    db.flush()

    notif = Notification(
        user_id=current_user.id,
        title=f"Support Ticket Registered: {ref_num}",
        message=f"Your {req.category} complaint has been recorded and will be addressed shortly.",
        category="support",
        link_url=f"/support/track/{ref_num}"
    )
    db.add(notif)
    db.commit()
    db.refresh(complaint)
    return complaint

@router.get("/complaints", response_model=List[ComplaintResponse])
def get_user_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Complaint).filter(
        Complaint.user_id == current_user.id
    ).order_by(Complaint.created_at.desc()).all()

@router.get("/complaints/{ref_or_id}", response_model=ComplaintResponse)
def get_complaint_detail(
    ref_or_id: str,
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(
        (Complaint.complaint_ref == ref_or_id) |
        (Complaint.id == (int(ref_or_id) if ref_or_id.isdigit() else -1))
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint record not found")
    
    return complaint
