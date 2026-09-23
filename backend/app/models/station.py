from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)  # MMCT, CSMT, NDLS
    name = Column(String(255), index=True, nullable=False)  # Mumbai Central, New Delhi
    city = Column(String(100), index=True, nullable=False)
    state = Column(String(100), nullable=False)
    zone = Column(String(50), nullable=True)  # WR, CR, NR, SR
    platform_count = Column(Integer, default=5)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    schedules = relationship("TrainSchedule", back_populates="station")
    food_vendors = relationship("FoodVendor", back_populates="station")
