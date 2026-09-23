from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_ref = Column(String(50), unique=True, index=True, nullable=False) # e.g. "CMP-849201"
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pnr = Column(String(50), nullable=True)
    train_number = Column(String(50), nullable=True)
    station_code = Column(String(50), nullable=True)
    category = Column(String(100), nullable=False) # "Train complaint", "Station complaint", "Cleanliness", "Catering", "Staff assistance", "Security assistance", "Medical assistance", "Other"
    description = Column(Text, nullable=False)
    status = Column(String(50), default="SUBMITTED") # "SUBMITTED", "IN_REVIEW", "ASSIGNED", "RESOLVED"
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="complaints")
    attachments = relationship("ComplaintAttachment", back_populates="complaint", cascade="all, delete-orphan")

class ComplaintAttachment(Base):
    __tablename__ = "complaint_attachments"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="attachments")
