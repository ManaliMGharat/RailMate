import uuid
import random
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.station import Station
from app.models.food import FoodVendor, FoodItem, FoodOrder, FoodOrderItem
from app.models.wallet import Wallet, WalletTransaction
from app.models.notification import Notification
from app.schemas.food import (
    FoodVendorResponse, FoodItemResponse, FoodOrderCreate, FoodOrderResponse,
    FoodOrderItemResponse
)

router = APIRouter(prefix="/food", tags=["Food Ordering"])

@router.get("/vendors", response_model=List[FoodVendorResponse])
def get_vendors(
    station_code: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(FoodVendor).filter(FoodVendor.is_active == True)
    if station_code:
        st = db.query(Station).filter(Station.code.ilike(station_code)).first()
        if st:
            query = query.filter(FoodVendor.station_id == st.id)
    return query.all()

@router.get("/vendors/{vendor_id}/menu", response_model=List[FoodItemResponse])
def get_vendor_menu(vendor_id: int, db: Session = Depends(get_db)):
    vendor = db.query(FoodVendor).filter(FoodVendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor.items

@router.post("/orders", response_model=FoodOrderResponse)
def create_food_order(
    req: FoodOrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vendor = db.query(FoodVendor).filter(FoodVendor.id == req.vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    total_amount = 0.0
    order_items_to_create = []

    for cart_item in req.items:
        item = db.query(FoodItem).filter(FoodItem.id == cart_item.item_id).first()
        if not item or not item.is_available:
            continue
        line_total = item.price * cart_item.quantity
        total_amount += line_total
        order_items_to_create.append((item.item_name, cart_item.quantity, item.price, line_total))

    if not order_items_to_create:
        raise HTTPException(status_code=400, detail="No valid items in food order")

    # If paying by wallet, check balance
    if req.payment_method == "WALLET":
        wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
        if not wallet or wallet.balance < total_amount:
            raise HTTPException(status_code=400, detail="Insufficient R-Wallet balance for food order")
        wallet.balance -= total_amount
        txn = WalletTransaction(
            wallet_id=wallet.id,
            user_id=current_user.id,
            transaction_type="DEBIT",
            amount=total_amount,
            reference=f"TXN-FD-{uuid.uuid4().hex[:6].upper()}",
            description=f"Food Order at {vendor.vendor_name}"
        )
        db.add(txn)

    order_ref = f"FD-{random.randint(10000, 99999)}"
    order = FoodOrder(
        order_ref=order_ref,
        user_id=current_user.id,
        vendor_id=vendor.id,
        train_number=req.train_number,
        pnr=req.pnr,
        delivery_station=req.delivery_station,
        coach=req.coach,
        seat=req.seat,
        total_amount=total_amount,
        status="CONFIRMED", # Start at Confirmed
        payment_status="PAID"
    )
    db.add(order)
    db.flush()

    saved_items = []
    for iname, qty, uprice, tprice in order_items_to_create:
        oi = FoodOrderItem(
            order_id=order.id,
            item_name=iname,
            quantity=qty,
            unit_price=uprice,
            total_price=tprice
        )
        db.add(oi)
        db.flush()
        saved_items.append(oi)

    notif = Notification(
        user_id=current_user.id,
        title=f"Food Order Confirmed: {order_ref}",
        message=f"{vendor.vendor_name} is preparing your food for delivery at {req.delivery_station} (Coach {req.coach}, Seat {req.seat}).",
        category="food"
    )
    db.add(notif)
    db.commit()
    db.refresh(order)

    return FoodOrderResponse(
        id=order.id,
        order_ref=order.order_ref,
        vendor_name=vendor.vendor_name,
        train_number=order.train_number,
        delivery_station=order.delivery_station,
        coach=order.coach,
        seat=order.seat,
        total_amount=order.total_amount,
        status=order.status,
        payment_status=order.payment_status,
        created_at=order.created_at,
        items=saved_items
    )

@router.get("/orders", response_model=List[FoodOrderResponse])
def get_user_food_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = db.query(FoodOrder).filter(
        FoodOrder.user_id == current_user.id
    ).order_by(FoodOrder.created_at.desc()).all()

    return [
        FoodOrderResponse(
            id=o.id,
            order_ref=o.order_ref,
            vendor_name=o.vendor.vendor_name,
            train_number=o.train_number,
            delivery_station=o.delivery_station,
            coach=o.coach,
            seat=o.seat,
            total_amount=o.total_amount,
            status=o.status,
            payment_status=o.payment_status,
            created_at=o.created_at,
            items=o.items
        )
        for o in orders
    ]
