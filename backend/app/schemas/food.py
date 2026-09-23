from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class FoodItemResponse(BaseModel):
    id: int
    item_name: str
    description: Optional[str] = None
    category: str
    price: float
    is_veg: bool
    image_url: Optional[str] = None
    is_available: bool

    class Config:
        from_attributes = True

class FoodVendorResponse(BaseModel):
    id: int
    vendor_name: str
    station_id: int
    cuisine_type: str
    rating: float
    image_url: Optional[str] = None
    is_active: bool
    items: List[FoodItemResponse] = []

    class Config:
        from_attributes = True

class CartItemInput(BaseModel):
    item_id: int
    quantity: int

class FoodOrderCreate(BaseModel):
    vendor_id: int
    train_number: str
    pnr: Optional[str] = None
    delivery_station: str
    coach: str
    seat: str
    items: List[CartItemInput]
    payment_method: str = "WALLET"

class FoodOrderItemResponse(BaseModel):
    id: int
    item_name: str
    quantity: int
    unit_price: float
    total_price: float

    class Config:
        from_attributes = True

class FoodOrderResponse(BaseModel):
    id: int
    order_ref: str
    vendor_name: str
    train_number: str
    delivery_station: str
    coach: str
    seat: str
    total_amount: float
    status: str
    payment_status: str
    created_at: datetime
    items: List[FoodOrderItemResponse] = []
