from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import verify_password, get_password_hash
from app.models.user import User, Passenger
from app.schemas.user import (
    UserResponse, UserUpdate, PassengerCreate, PassengerResponse, ChangePasswordRequest
)

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_profile(
    req: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.full_name is not None:
        current_user.full_name = req.full_name
    if req.mobile is not None:
        current_user.mobile = req.mobile
    if req.dob is not None:
        current_user.dob = req.dob
    if req.gender is not None:
        current_user.gender = req.gender
    if req.address is not None:
        current_user.address = req.address

    # Calculate profile completion
    fields = [current_user.full_name, current_user.email, current_user.mobile, current_user.dob, current_user.gender, current_user.address]
    filled = sum(1 for f in fields if f)
    current_user.profile_completion = int((filled / len(fields)) * 100)

    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"success": True, "message": "Password changed successfully"}

@router.delete("/me")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.is_active = False
    db.commit()
    return {"success": True, "message": "Account deactivated successfully"}

# Saved Passenger Endpoints
@router.get("/passengers", response_model=List[PassengerResponse])
def get_passengers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Passenger).filter(Passenger.user_id == current_user.id).all()

@router.post("/passengers", response_model=PassengerResponse)
def add_passenger(
    req: PassengerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    p = Passenger(user_id=current_user.id, **req.dict())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

@router.delete("/passengers/{passenger_id}")
def delete_passenger(
    passenger_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    p = db.query(Passenger).filter(
        Passenger.id == passenger_id,
        Passenger.user_id == current_user.id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Passenger not found")
    db.delete(p)
    db.commit()
    return {"success": True, "message": "Passenger removed"}
