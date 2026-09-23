from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class UnreservedTicket(Base):
    __tablename__ = "unreserved_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_ref = Column(String(50), unique=True, index=True, nullable=False) # e.g. "UTS-789012"
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticket_type = Column(String(50), nullable=False) # "JOURNEY", "PLATFORM", "SEASON"
    from_station = Column(String(255), nullable=False)
    to_station = Column(String(255), nullable=True) # None for platform tickets
    passenger_count = Column(Integer, default=1)
    travel_class = Column(String(20), default="II") # II (Second Class), FC (First Class)
    duration_type = Column(String(50), nullable=True) # "MONTHLY", "QUARTERLY" (for season tickets)
    fare = Column(Float, nullable=False)
    validity_start = Column(DateTime, default=datetime.utcnow)
    validity_end = Column(DateTime, nullable=False)
    qr_payload = Column(Text, nullable=False)
    status = Column(String(20), default="ACTIVE") # "ACTIVE", "EXPIRED"
    created_at = Column(DateTime, default=datetime.utcnow)
