from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.models.user import User
from app.models.station import Station
from app.models.train import Train
from app.models.booking import Booking
from app.models.food import FoodOrder
from app.models.support import Complaint
from app.models.refund import Refund

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

class StatusUpdateRequest(BaseModel):
    status: str
    notes: Optional[str] = None

class CreateTrainRequest(BaseModel):
    number: str
    name: str
    train_type: str = "Superfast"
    source_station_id: int
    destination_station_id: int
    departure_time: str
    arrival_time: str
    duration_hours: float
    running_days: str = "1,2,3,4,5,6,7"
    available_classes: str = "1A,2A,3A,SL"

@router.get("/stats")
def get_dashboard_stats(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_trains = db.query(Train).count()
    total_stations = db.query(Station).count()
    total_bookings = db.query(Booking).count()
    active_bookings = db.query(Booking).filter(Booking.status == "CONFIRMED").count()
    cancelled_bookings = db.query(Booking).filter(Booking.status == "CANCELLED").count()
    total_complaints = db.query(Complaint).count()
    pending_complaints = db.query(Complaint).filter(Complaint.status != "RESOLVED").count()
    total_food_orders = db.query(FoodOrder).count()
    total_refunds = db.query(Refund).count()

    # Revenue calculation
    confirmed_bookings = db.query(Booking).filter(Booking.status != "CANCELLED").all()
    total_revenue = sum(b.total_amount for b in confirmed_bookings)

    return {
        "total_users": total_users,
        "total_trains": total_trains,
        "total_stations": total_stations,
        "total_bookings": total_bookings,
        "active_bookings": active_bookings,
        "cancelled_bookings": cancelled_bookings,
        "total_complaints": total_complaints,
        "pending_complaints": pending_complaints,
        "total_food_orders": total_food_orders,
        "total_refunds": total_refunds,
        "total_revenue": round(total_revenue, 2)
    }

@router.get("/trains")
def list_trains_admin(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    trains = db.query(Train).all()
    return [
        {
            "id": t.id,
            "number": t.number,
            "name": t.name,
            "train_type": t.train_type,
            "source": t.source_station.name,
            "destination": t.destination_station.name,
            "departure": t.departure_time,
            "arrival": t.arrival_time,
            "classes": t.available_classes
        }
        for t in trains
    ]

@router.post("/trains")
def create_train(
    req: CreateTrainRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    train = Train(**req.dict())
    db.add(train)
    db.commit()
    db.refresh(train)
    return {"success": True, "message": "Train created successfully", "train_id": train.id}

@router.delete("/trains/{train_id}")
def delete_train(
    train_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    t = db.query(Train).filter(Train.id == train_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Train not found")
    db.delete(t)
    db.commit()
    return {"success": True, "message": "Train deleted"}

@router.get("/bookings")
def list_bookings_admin(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(50).all()
    return [
        {
            "id": b.id,
            "booking_ref": b.booking_ref,
            "pnr": b.pnr_number,
            "user_email": b.user.email if b.user else "Unknown",
            "train": f"{b.train.number} - {b.train.name}",
            "route": f"{b.from_station.code} ➔ {b.to_station.code}",
            "journey_date": b.journey_date,
            "class": b.travel_class,
            "amount": b.total_amount,
            "status": b.status
        }
        for b in bookings
    ]

@router.get("/complaints")
def list_complaints_admin(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    return complaints

@router.put("/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: int,
    req: StatusUpdateRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    c.status = req.status
    if req.notes:
        c.resolution_notes = req.notes
    db.commit()
    return {"success": True, "message": f"Complaint status updated to {req.status}"}

@router.get("/food-orders")
def list_food_orders_admin(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    orders = db.query(FoodOrder).order_by(FoodOrder.created_at.desc()).all()
    return [
        {
            "id": o.id,
            "order_ref": o.order_ref,
            "vendor": o.vendor.vendor_name,
            "train": o.train_number,
            "delivery_station": o.delivery_station,
            "seat": f"{o.coach}-{o.seat}",
            "amount": o.total_amount,
            "status": o.status
        }
        for o in orders
    ]

@router.put("/food-orders/{order_id}/status")
def update_food_order_status(
    order_id: int,
    req: StatusUpdateRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    o = db.query(FoodOrder).filter(FoodOrder.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Food order not found")
    o.status = req.status
    db.commit()
    return {"success": True, "message": f"Food order status updated to {req.status}"}
