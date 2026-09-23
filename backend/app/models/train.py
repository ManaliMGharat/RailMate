from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Train(Base):
    __tablename__ = "trains"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(20), unique=True, index=True, nullable=False)  # e.g. "12951"
    name = Column(String(255), index=True, nullable=False)  # e.g. "Mumbai Rajdhani Express"
    train_type = Column(String(100), default="Superfast")  # Vande Bharat, Rajdhani, Express, Shatabdi
    source_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    destination_station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    departure_time = Column(String(20), nullable=False)  # "17:00"
    arrival_time = Column(String(20), nullable=False)    # "08:32"
    duration_hours = Column(Float, nullable=False)       # 15.5
    running_days = Column(String(50), default="1,2,3,4,5,6,7")  # Comma separated day numbers (1=Mon, 7=Sun)
    available_classes = Column(String(100), default="1A,2A,3A,SL") # Comma separated
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    source_station = relationship("Station", foreign_keys=[source_station_id])
    destination_station = relationship("Station", foreign_keys=[destination_station_id])
    schedules = relationship("TrainSchedule", back_populates="train", order_by="TrainSchedule.stop_sequence", cascade="all, delete-orphan")
    coaches = relationship("Coach", back_populates="train", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="train")

class TrainSchedule(Base):
    __tablename__ = "train_schedules"

    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id", ondelete="CASCADE"), nullable=False)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    stop_sequence = Column(Integer, nullable=False)
    arrival_time = Column(String(20), nullable=False)   # "00:00" for source
    departure_time = Column(String(20), nullable=False) # "00:00" for dest
    halt_minutes = Column(Integer, default=2)
    day_number = Column(Integer, default=1)
    distance_km = Column(Integer, default=0)
    platform_number = Column(Integer, default=1)

    train = relationship("Train", back_populates="schedules")
    station = relationship("Station", back_populates="schedules")

class Coach(Base):
    __tablename__ = "coaches"

    id = Column(Integer, primary_key=True, index=True)
    train_id = Column(Integer, ForeignKey("trains.id", ondelete="CASCADE"), nullable=False)
    coach_code = Column(String(20), nullable=False)  # "S1", "B1", "A1", "H1", "GEN"
    coach_type = Column(String(20), nullable=False)  # "1A", "2A", "3A", "3E", "SL", "CC", "EC", "2S", "GEN"
    sequence_order = Column(Integer, default=1)     # Position from engine
    total_seats = Column(Integer, default=72)
    platform_zone = Column(String(50), default="Platform Zone B")

    train = relationship("Train", back_populates="coaches")
    seats = relationship("Seat", back_populates="coach", cascade="all, delete-orphan")

class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    coach_id = Column(Integer, ForeignKey("coaches.id", ondelete="CASCADE"), nullable=False)
    seat_number = Column(Integer, nullable=False)
    berth_type = Column(String(50), nullable=False)  # "Lower", "Middle", "Upper", "Side Lower", "Side Upper", "Window", "Aisle"
    is_booked = Column(Boolean, default=False)

    coach = relationship("Coach", back_populates="seats")
