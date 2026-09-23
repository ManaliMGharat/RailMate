from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Refund(Base):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True)
    refund_ref = Column(String(50), unique=True, index=True, nullable=False) # e.g. "RF-20941"
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_amount = Column(Float, nullable=False)
    cancellation_charge = Column(Float, nullable=False)
    refund_amount = Column(Float, nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String(50), default="PROCESSING") # "REQUESTED", "PROCESSING", "APPROVED", "COMPLETED", "REJECTED"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    booking = relationship("Booking", back_populates="refund")
