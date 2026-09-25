from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)  # MMCT, BCT, CSMT, NDLS, KYN
    name = Column(String(255), index=True, nullable=False)  # Mumbai Central, Kalyan Junction, etc.
    city = Column(String(100), index=True, nullable=False)
    state = Column(String(100), nullable=False)
    zone = Column(String(50), nullable=True)  # WR, CR, NR, SR, etc.
    division = Column(String(100), nullable=True)  # Mumbai, Pune, Delhi, etc.
    district = Column(String(100), nullable=True)  # Mumbai City, Mumbai Suburban, Thane, Palghar, Raigad
    station_type = Column(String(50), default="SUBURBAN")  # SUBURBAN, MAINLINE, TERMINUS
    corridors = Column(Text, nullable=True)  # e.g. "Western Line", "Central Main, Harbour"
    search_aliases = Column(Text, nullable=True)  # e.g. "cst, vt, bombay, victoria terminus"
    is_active = Column(Boolean, default=True)
    is_junction = Column(Boolean, default=False)
    is_major = Column(Boolean, default=False)
    platform_count = Column(Integer, default=5)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    schedules = relationship("TrainSchedule", back_populates="station")
    food_vendors = relationship("FoodVendor", back_populates="station")

    __table_args__ = (
        Index("idx_station_code_name_city", "code", "name", "city"),
    )
