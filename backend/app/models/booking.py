from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_ref = Column(String(50), unique=True, index=True, nullable=False)  # "BK-842910"
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    train_id = Column(Integer, ForeignKey("trains.id"), nullable=False)
    from_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    to_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    journey_date = Column(String(20), nullable=False)  # "2026-10-15"
    travel_class = Column(String(20), nullable=False)  # "3A", "2A", "SL", etc.
    quota = Column(String(50), default="General")     # "General", "Tatkal", "Ladies", etc.
    status = Column(String(50), default="CONFIRMED")   # "CONFIRMED", "WAITING", "CANCELLED"
    pnr_number = Column(String(20), unique=True, index=True, nullable=False)
    base_fare = Column(Float, nullable=False)
    taxes = Column(Float, default=35.0)
    total_amount = Column(Float, nullable=False)
    qr_code = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="bookings")
    train = relationship("Train", back_populates="bookings")
    from_station = relationship("Station", foreign_keys=[from_station_id])
    to_station = relationship("Station", foreign_keys=[to_station_id])
    passengers = relationship("BookingPassenger", back_populates="booking", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="booking", uselist=False)
    refund = relationship("Refund", back_populates="booking", uselist=False)

class BookingPassenger(Base):
    __tablename__ = "booking_passengers"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    berth_preference = Column(String(50), default="No Preference")
    allocated_coach = Column(String(20), nullable=True)  # e.g. "B2"
    allocated_seat = Column(Integer, nullable=True)     # e.g. 45
    allocated_berth_type = Column(String(50), nullable=True)  # "Lower"
    status = Column(String(20), default="CNF")          # "CNF", "WL", "RAC"

    booking = relationship("Booking", back_populates="passengers")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False)  # "UPI", "DEBIT_CARD", "CREDIT_CARD", "NET_BANKING", "WALLET"
    transaction_ref = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(String(50), default="SUCCESS")       # "SUCCESS", "PENDING", "FAILED"
    created_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", back_populates="payment")
