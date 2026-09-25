from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr

class PassengerBase(BaseModel):
    name: str
    age: int
    gender: str
    berth_preference: Optional[str] = "No Preference"
    id_type: Optional[str] = "Aadhaar"
    id_number: Optional[str] = None
    meal_preference: Optional[str] = "Veg"

class PassengerCreate(PassengerBase):
    pass

class PassengerResponse(PassengerBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    mobile: Optional[str] = None
    full_name: str
    role: str
    dob: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    profile_completion: int
    is_active: bool
    is_phone_verified: bool = False
    created_at: datetime
    passengers: List[PassengerResponse] = []

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
