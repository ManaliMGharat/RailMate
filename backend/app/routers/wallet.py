import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.wallet import Wallet, WalletTransaction
from app.schemas.wallet import WalletResponse, AddMoneyRequest, WalletTransactionResponse

router = APIRouter(prefix="/wallet", tags=["R-Wallet"])

@router.get("", response_model=WalletResponse)
def get_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if not wallet:
        wallet = Wallet(user_id=current_user.id, balance=1000.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)

    txns = db.query(WalletTransaction).filter(
        WalletTransaction.wallet_id == wallet.id
    ).order_by(WalletTransaction.created_at.desc()).all()

    return WalletResponse(
        balance=wallet.balance,
        transactions=[
            WalletTransactionResponse(
                id=t.id,
                transaction_type=t.transaction_type,
                amount=t.amount,
                reference=t.reference,
                description=t.description,
                created_at=t.created_at
            )
            for t in txns
        ]
    )

@router.post("/add-money", response_model=WalletResponse)
def add_money(
    req: AddMoneyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if not wallet:
        wallet = Wallet(user_id=current_user.id, balance=0.0)
        db.add(wallet)
        db.flush()

    wallet.balance += req.amount
    txn = WalletTransaction(
        wallet_id=wallet.id,
        user_id=current_user.id,
        transaction_type="CREDIT",
        amount=req.amount,
        reference=f"TXN-TOPUP-{uuid.uuid4().hex[:6].upper()}",
        description=f"Wallet Top-up via {req.payment_method}"
    )
    db.add(txn)
    db.commit()
    db.refresh(wallet)

    return get_wallet(current_user, db)

@router.get("/transactions", response_model=List[WalletTransactionResponse])
def get_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wallet = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if not wallet:
        return []
    return db.query(WalletTransaction).filter(
        WalletTransaction.wallet_id == wallet.id
    ).order_by(WalletTransaction.created_at.desc()).all()
