from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.core.database import Base

class PNRRecord(Base):
    __tablename__ = "pnr_records"

    id = Column(Integer, primary_key=True, index=True)
    pnr_number = Column(String(20), unique=True, index=True, nullable=False)
    booking_id = Column(Integer, nullable=True)
    train_number = Column(String(20), nullable=False)
    train_name = Column(String(255), nullable=False)
    journey_date = Column(String(20), nullable=False)
    from_station = Column(String(255), nullable=False)
    to_station = Column(String(255), nullable=False)
    boarding_point = Column(String(255), nullable=False)
    travel_class = Column(String(20), nullable=False)
    quota = Column(String(50), default="General")
    chart_status = Column(String(50), default="CHART NOT PREPARED") # "CHART PREPARED", "CHART NOT PREPARED"
    passengers_json = Column(Text, nullable=False) # JSON list of passenger statuses
    created_at = Column(DateTime, default=datetime.utcnow)
