from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, decode_token
)
from app.models.user import User
from app.models.wallet import Wallet, WalletTransaction
from app.models.notification import Notification
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse,
    RefreshRequest, ForgotPasswordRequest, ResetPasswordRequest
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter((User.email == req.email) | (User.mobile == req.mobile)).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email or mobile already exists")
    
    user = User(
        email=req.email,
        mobile=req.mobile,
        full_name=req.full_name,
        hashed_password=get_password_hash(req.password),
        role="user",
        profile_completion=70
    )
    db.add(user)
    db.flush()

    # Create initial R-Wallet with ₹1000 welcome credit
    wallet = Wallet(user_id=user.id, balance=1000.0)
    db.add(wallet)
    db.flush()
    txn = WalletTransaction(
        wallet_id=wallet.id,
        user_id=user.id,
        transaction_type="CREDIT",
        amount=1000.0,
        reference=f"TXN-WELCOME-{user.id}",
        description="RailMate Welcome Bonus Credit"
    )
    db.add(txn)

    # Welcome notification
    welcome_notif = Notification(
        user_id=user.id,
        title="Welcome to RailMate!",
        message="Your account is active. Explore trains, check PNR status, and order food on your journey.",
        category="general"
    )
    db.add(welcome_notif)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "mobile": user.mobile
        }
    )

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.email == req.email) | (User.mobile == req.email)
    ).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "mobile": user.mobile
        }
    )

@router.post("/refresh", response_model=dict)
def refresh_token(req: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    new_access_token = create_access_token(user.id)
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.post("/logout")
def logout():
    return {"success": True, "message": "Successfully logged out"}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    # Return mock OTP response for demo project
    return {
        "success": True,
        "message": "Demo OTP generated. Use 123456 to reset password.",
        "mock_otp": "123456",
        "email": req.email
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    if req.otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP. Use demo OTP 123456.")
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"success": True, "message": "Password successfully reset. Please log in."}
