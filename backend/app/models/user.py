from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    mobile = Column(String(20), unique=True, index=True, nullable=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="user")  # "user" or "admin"
    dob = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    profile_completion = Column(Integer, default=70)
    is_active = Column(Boolean, default=True)

    # mPIN authentication
    hashed_mpin = Column(String(255), nullable=True)
    mpin_enabled = Column(Boolean, default=False)
    mpin_failed_attempts = Column(Integer, default=0)
    mpin_locked_until = Column(DateTime, nullable=True)

    # Biometric authentication
    biometric_enabled = Column(Boolean, default=False)

    # Phone verification status
    is_phone_verified = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    passengers = relationship("Passenger", back_populates="user", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user")
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    complaints = relationship("Complaint", back_populates="user")
    food_orders = relationship("FoodOrder", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    webauthn_credentials = relationship("WebAuthnCredential", back_populates="user", cascade="all, delete-orphan")

class Passenger(Base):
    __tablename__ = "passengers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)  # Male, Female, Other
    berth_preference = Column(String(50), default="No Preference")  # Lower, Middle, Upper, Side Lower, Side Upper
    id_type = Column(String(50), nullable=True)  # Aadhaar, PAN, Passport, Voter ID
    id_number = Column(String(100), nullable=True)
    meal_preference = Column(String(50), default="Veg")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="passengers")

class PhoneOTP(Base):
    __tablename__ = "phone_otps"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), index=True, nullable=False)
    otp_code = Column(String(10), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

