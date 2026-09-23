from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class FoodVendor(Base):
    __tablename__ = "food_vendors"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    vendor_name = Column(String(255), nullable=False) # e.g. "Haldiram's Express", "Domino's Pizza"
    cuisine_type = Column(String(255), nullable=False) # "North Indian, Fast Food, Sweets"
    rating = Column(Float, default=4.5)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)

    station = relationship("Station", back_populates="food_vendors")
    items = relationship("FoodItem", back_populates="vendor", cascade="all, delete-orphan")
    orders = relationship("FoodOrder", back_populates="vendor")

class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("food_vendors.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="Meals") # "Thali", "Snacks", "Beverages", "Dessert"
    price = Column(Float, nullable=False)
    is_veg = Column(Boolean, default=True)
    image_url = Column(String(500), nullable=True)
    is_available = Column(Boolean, default=True)

    vendor = relationship("FoodVendor", back_populates="items")

class FoodOrder(Base):
    __tablename__ = "food_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_ref = Column(String(50), unique=True, index=True, nullable=False) # e.g. "FD-30291"
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("food_vendors.id"), nullable=False)
    train_number = Column(String(50), nullable=False)
    pnr = Column(String(50), nullable=True)
    delivery_station = Column(String(255), nullable=False)
    coach = Column(String(20), nullable=False)
    seat = Column(String(20), nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String(50), default="PLACED") # "PLACED", "CONFIRMED", "PREPARING", "READY", "DELIVERED"
    payment_status = Column(String(50), default="PAID")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="food_orders")
    vendor = relationship("FoodVendor", back_populates="orders")
    items = relationship("FoodOrderItem", back_populates="order", cascade="all, delete-orphan")

class FoodOrderItem(Base):
    __tablename__ = "food_order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("food_orders.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String(255), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    order = relationship("FoodOrder", back_populates="items")
