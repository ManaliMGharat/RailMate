import re
from typing import Optional, List
from datetime import datetime, timedelta
import secrets
import base64
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_current_user
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, decode_token, get_mpin_hash, verify_mpin
)
from app.models.user import User, PhoneOTP
from app.models.wallet import Wallet, WalletTransaction
from app.models.notification import Notification
from app.schemas.user import UserResponse
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse,
    RefreshRequest, ForgotPasswordRequest, ResetPasswordRequest,
    MPINSetRequest, MPINVerifyRequest, MPINChangeRequest, MPINToggleRequest, MPINStatusResponse,
    BiometricChallengeResponse, BiometricRegisterRequest, BiometricLoginRequest,
    BiometricToggleRequest, BiometricStatusResponse,
    SendPhoneOTPRequest, VerifyPhoneOTPRequest, PhoneOTPResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def normalize_phone_number(phone: str) -> str:
    """Normalize Indian phone number to standard +91XXXXXXXXXX format and validate."""
    if not phone:
        raise HTTPException(status_code=400, detail="Mobile number is required.")
    cleaned = re.sub(r'[\s\-\(\)]', '', phone.strip())
    if cleaned.startswith('+91'):
        cleaned = cleaned[3:]
    elif cleaned.startswith('91') and len(cleaned) == 12:
        cleaned = cleaned[2:]
    elif cleaned.startswith('0') and len(cleaned) == 11:
        cleaned = cleaned[1:]
    
    if not (len(cleaned) == 10 and cleaned.isdigit() and cleaned[0] in '6789'):
        raise HTTPException(
            status_code=400,
            detail="Invalid Indian mobile number. Please enter a valid 10-digit number starting with 6, 7, 8, or 9."
        )
    return f"+91{cleaned}"

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    norm_mobile = normalize_phone_number(req.mobile) if req.mobile else None
    
    existing = db.query(User).filter(
        (User.email == req.email.strip().lower()) | 
        (User.mobile == norm_mobile if norm_mobile else False) |
        (User.mobile == req.mobile.strip() if req.mobile else False)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email or mobile number already exists")
    
    user = User(
        email=req.email.strip().lower(),
        mobile=norm_mobile or req.mobile,
        full_name=req.full_name.strip(),
        hashed_password=get_password_hash(req.password),
        role="user",
        is_phone_verified=False,
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
        description="RailOne Welcome Bonus Credit"
    )
    db.add(txn)

    # Welcome notification
    welcome_notif = Notification(
        user_id=user.id,
        title="Welcome to RailOne!",
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
            "mobile": user.mobile,
            "is_phone_verified": user.is_phone_verified
        }
    )

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    lookup = (req.email or req.username or "").strip()
    if not lookup:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username is required"
        )
    norm_mobile = None
    try:
        norm_mobile = normalize_phone_number(lookup)
    except HTTPException:
        pass

    user = db.query(User).filter(
        (User.email.ilike(lookup)) |
        (User.mobile == lookup) |
        (User.mobile == norm_mobile if norm_mobile else False) |
        (User.mobile == lookup.replace("+91", ""))
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
            "mobile": user.mobile,
            "is_phone_verified": bool(user.is_phone_verified)
        }
    )

@router.get("/me", response_model=UserResponse)
def get_current_auth_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/send-phone-otp", response_model=PhoneOTPResponse)
def send_phone_otp(req: SendPhoneOTPRequest, db: Session = Depends(get_db)):
    phone = normalize_phone_number(req.phone_number)
    
    # Rate limit check: prevent rapid spam (> 5 in 2 minutes)
    recent_otps = db.query(PhoneOTP).filter(
        PhoneOTP.phone_number == phone,
        PhoneOTP.created_at >= datetime.utcnow() - timedelta(minutes=2)
    ).count()
    if recent_otps >= 5:
        raise HTTPException(
            status_code=429,
            detail="Too many OTP requests. Please wait a minute before requesting another OTP."
        )

    # In demo environment: deterministic demo OTP code 123456
    demo_code = "123456"
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    otp_record = PhoneOTP(
        phone_number=phone,
        otp_code=demo_code,
        expires_at=expires_at,
        attempts=0,
        is_used=False
    )
    db.add(otp_record)
    db.commit()

    return PhoneOTPResponse(
        success=True,
        message=f"Demo OTP sent to {phone}. Use code {demo_code} (Valid for 5 minutes).",
        demo_otp=demo_code,
        expires_in_seconds=300
    )

@router.post("/verify-phone-otp", response_model=PhoneOTPResponse)
def verify_phone_otp(req: VerifyPhoneOTPRequest, db: Session = Depends(get_db)):
    phone = normalize_phone_number(req.phone_number)
    entered_otp = req.otp.strip()

    otp_record = db.query(PhoneOTP).filter(
        PhoneOTP.phone_number == phone,
        PhoneOTP.is_used == False
    ).order_by(PhoneOTP.created_at.desc()).first()

    is_valid = False
    if otp_record:
        if otp_record.attempts >= 5:
            raise HTTPException(status_code=400, detail="Too many invalid attempts. Please request a new OTP.")
        
        if datetime.utcnow() > otp_record.expires_at:
            raise HTTPException(status_code=400, detail="OTP has expired. Please request a new OTP.")
        
        if otp_record.otp_code == entered_otp or entered_otp == "123456":
            otp_record.is_used = True
            is_valid = True
        else:
            otp_record.attempts += 1
            db.commit()
            raise HTTPException(status_code=400, detail=f"Invalid OTP code. {5 - otp_record.attempts} attempts remaining.")
    elif entered_otp == "123456":
        is_valid = True

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid OTP code.")

    # Mark user as phone verified if user exists
    user = db.query(User).filter(
        (User.mobile == phone) |
        (User.mobile == phone.replace("+91", ""))
    ).first()
    if user:
        user.is_phone_verified = True
        user.mobile = phone

    db.commit()

    return PhoneOTPResponse(
        success=True,
        message="Phone number successfully verified!",
        demo_otp=None
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


# ============================================================================
# 6-DIGIT mPIN AUTHENTICATION ENDPOINTS
# ============================================================================

MAX_MPIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

def validate_mpin_format(mpin: str):
    if not mpin or len(mpin) != 6 or not mpin.isdigit():
        raise HTTPException(
            status_code=400,
            detail="mPIN must be exactly 6 digits (0-9)"
        )

@router.post("/mpin/set")
def set_mpin(
    req: MPINSetRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    validate_mpin_format(req.mpin)
    current_user.hashed_mpin = get_mpin_hash(req.mpin)
    current_user.mpin_enabled = True
    current_user.mpin_failed_attempts = 0
    current_user.mpin_locked_until = None
    db.commit()
    return {
        "success": True,
        "message": "6-digit mPIN set successfully"
    }

@router.post("/mpin/verify", response_model=TokenResponse)
def verify_mpin_auth(
    req: MPINVerifyRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    validate_mpin_format(req.mpin)

    target_user = current_user
    if not target_user and req.email_or_mobile:
        identifier = req.email_or_mobile.strip()
        norm_mob = None
        try:
            norm_mob = normalize_phone_number(identifier)
        except HTTPException:
            pass
        target_user = db.query(User).filter(
            (User.email.ilike(identifier)) |
            (User.mobile == identifier) |
            (User.mobile == norm_mob if norm_mob else False) |
            (User.mobile == identifier.replace("+91", ""))
        ).first()

    if not target_user:
        # Fallback to demo user
        target_user = db.query(User).filter(
            (User.email.ilike("demo@railone.com")) | (User.email.ilike("demo@railmate.com"))
        ).first()

    if not target_user:
        raise HTTPException(
            status_code=400,
            detail="User identification required to verify mPIN"
        )

    # Ensure demo user has mPIN enabled with default 123456
    if not target_user.hashed_mpin and target_user.email and target_user.email.lower() in ["demo@railone.com", "demo@railmate.com"]:
        target_user.hashed_mpin = get_mpin_hash("123456")
        target_user.mpin_enabled = True
        db.commit()

    if not target_user.hashed_mpin or not target_user.mpin_enabled:
        raise HTTPException(
            status_code=400,
            detail="mPIN login is not enabled for this account"
        )

    # Check lockout
    now = datetime.utcnow()
    if target_user.mpin_locked_until and target_user.mpin_locked_until > now:
        remaining_seconds = int((target_user.mpin_locked_until - now).total_seconds())
        remaining_minutes = max(1, remaining_seconds // 60)
        raise HTTPException(
            status_code=423,
            detail=f"mPIN locked due to too many failed attempts. Try again in {remaining_minutes} minute(s)."
        )
    elif target_user.mpin_locked_until and target_user.mpin_locked_until <= now:
        # Lockout expired, reset attempts
        target_user.mpin_failed_attempts = 0
        target_user.mpin_locked_until = None

    if not verify_mpin(req.mpin, target_user.hashed_mpin):
        target_user.mpin_failed_attempts = (target_user.mpin_failed_attempts or 0) + 1
        attempts_left = MAX_MPIN_ATTEMPTS - target_user.mpin_failed_attempts
        if target_user.mpin_failed_attempts >= MAX_MPIN_ATTEMPTS:
            target_user.mpin_locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
            db.commit()
            raise HTTPException(
                status_code=423,
                detail=f"mPIN locked for {LOCKOUT_MINUTES} minutes due to 5 incorrect attempts."
            )
        db.commit()
        raise HTTPException(
            status_code=401,
            detail=f"Incorrect mPIN. {attempts_left} attempt(s) remaining."
        )

    # Success: reset attempts
    target_user.mpin_failed_attempts = 0
    target_user.mpin_locked_until = None
    db.commit()

    access_token = create_access_token(target_user.id)
    refresh_token = create_refresh_token(target_user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": target_user.id,
            "email": target_user.email,
            "full_name": target_user.full_name,
            "role": target_user.role,
            "mobile": target_user.mobile
        }
    )

@router.post("/mpin/change")
def change_mpin(
    req: MPINChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    validate_mpin_format(req.old_mpin)
    validate_mpin_format(req.new_mpin)

    if not current_user.hashed_mpin:
        raise HTTPException(status_code=400, detail="No mPIN has been set yet")

    if not verify_mpin(req.old_mpin, current_user.hashed_mpin):
        raise HTTPException(status_code=401, detail="Current mPIN is incorrect")

    current_user.hashed_mpin = get_mpin_hash(req.new_mpin)
    current_user.mpin_enabled = True
    current_user.mpin_failed_attempts = 0
    current_user.mpin_locked_until = None
    db.commit()
    return {"success": True, "message": "mPIN successfully updated"}

@router.post("/mpin/toggle")
def toggle_mpin(
    req: MPINToggleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.enabled and not current_user.hashed_mpin:
        raise HTTPException(
            status_code=400,
            detail="Please set a 6-digit mPIN before enabling mPIN login"
        )
    current_user.mpin_enabled = req.enabled
    db.commit()
    return {
        "success": True,
        "mpin_enabled": current_user.mpin_enabled,
        "message": f"mPIN login {'enabled' if req.enabled else 'disabled'}"
    }

@router.get("/mpin/status", response_model=MPINStatusResponse)
def get_mpin_status(
    email_or_mobile: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    user = current_user
    if not user and email_or_mobile:
        identifier = email_or_mobile.strip()
        norm_mob = None
        try:
            norm_mob = normalize_phone_number(identifier)
        except HTTPException:
            pass
        user = db.query(User).filter(
            (User.email.ilike(identifier)) |
            (User.mobile == identifier) |
            (User.mobile == norm_mob if norm_mob else False) |
            (User.mobile == identifier.replace("+91", ""))
        ).first()

    if not user and (not email_or_mobile or "demo" in (email_or_mobile or "").lower()):
        user = db.query(User).filter(
            (User.email.ilike("demo@railone.com")) | (User.email.ilike("demo@railmate.com"))
        ).first()

    if not user:
        return MPINStatusResponse(
            mpin_enabled=False,
            has_mpin=False,
            is_locked=False,
            locked_until=None,
            attempts_remaining=MAX_MPIN_ATTEMPTS
        )

    now = datetime.utcnow()
    is_locked = bool(user.mpin_locked_until and user.mpin_locked_until > now)
    locked_str = user.mpin_locked_until.isoformat() if is_locked else None
    remaining = max(0, MAX_MPIN_ATTEMPTS - (user.mpin_failed_attempts or 0)) if not is_locked else 0

    return MPINStatusResponse(
        mpin_enabled=bool(user.mpin_enabled),
        has_mpin=bool(user.hashed_mpin),
        is_locked=is_locked,
        locked_until=locked_str,
        attempts_remaining=remaining
    )


# ============================================================================
# WEBAUTHN BIOMETRIC AUTHENTICATION ENDPOINTS
# ============================================================================

import secrets
import base64

@router.post("/biometric/register-challenge", response_model=BiometricChallengeResponse)
def get_biometric_register_challenge(
    current_user: User = Depends(get_current_user)
):
    challenge_bytes = secrets.token_bytes(32)
    challenge_b64 = base64.urlsafe_b64encode(challenge_bytes).decode("utf-8").rstrip("=")

    return BiometricChallengeResponse(
        challenge=challenge_b64,
        rp_id="localhost",
        rp_name="RailOne",
        user_id=str(current_user.id),
        user_name=current_user.email,
        user_display_name=current_user.full_name
    )

@router.post("/biometric/register-verify")
def verify_biometric_register(
    req: BiometricRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.webauthn import WebAuthnCredential

    existing = db.query(WebAuthnCredential).filter(
        WebAuthnCredential.credential_id == req.credential_id
    ).first()
    if existing:
        existing.public_key = req.public_key
        existing.device_name = req.device_name or "Registered Device"
        existing.is_active = True
    else:
        cred = WebAuthnCredential(
            user_id=current_user.id,
            credential_id=req.credential_id,
            public_key=req.public_key,
            device_name=req.device_name or "Primary Device",
            transports=req.transports or "internal",
            is_active=True
        )
        db.add(cred)

    current_user.biometric_enabled = True
    db.commit()
    return {
        "success": True,
        "message": "Biometric credential registered successfully"
    }

@router.post("/biometric/login-challenge", response_model=BiometricChallengeResponse)
def get_biometric_login_challenge(
    email_or_mobile: Optional[str] = None,
    db: Session = Depends(get_db)
):
    challenge_bytes = secrets.token_bytes(32)
    challenge_b64 = base64.urlsafe_b64encode(challenge_bytes).decode("utf-8").rstrip("=")

    user = None
    if email_or_mobile:
        user = db.query(User).filter(
            (User.email == email_or_mobile.strip()) | (User.mobile == email_or_mobile.strip())
        ).first()

    return BiometricChallengeResponse(
        challenge=challenge_b64,
        rp_id="localhost",
        rp_name="RailOne",
        user_id=str(user.id) if user else "guest",
        user_name=user.email if user else "guest@railone.com",
        user_display_name=user.full_name if user else "RailOne Traveler"
    )

@router.post("/biometric/login-verify", response_model=TokenResponse)
def verify_biometric_login(
    req: BiometricLoginRequest,
    db: Session = Depends(get_db)
):
    from app.models.webauthn import WebAuthnCredential

    cred = db.query(WebAuthnCredential).filter(
        WebAuthnCredential.credential_id == req.credential_id,
        WebAuthnCredential.is_active == True
    ).first()

    target_user = None
    if cred:
        target_user = cred.user
    elif req.email_or_mobile:
        identifier = req.email_or_mobile.strip()
        target_user = db.query(User).filter(
            (User.email.ilike(identifier)) | (User.mobile == identifier)
        ).first()

    if not target_user:
        # Fallback to demo user if simulated biometric login in demo mode
        target_user = db.query(User).filter(
            (User.email.ilike("demo@railone.com")) | (User.email.ilike("demo@railmate.com"))
        ).first()

    if not target_user:
        raise HTTPException(
            status_code=401,
            detail="Biometric credential not recognized"
        )

    access_token = create_access_token(target_user.id)
    refresh_token = create_refresh_token(target_user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": target_user.id,
            "email": target_user.email,
            "full_name": target_user.full_name,
            "role": target_user.role,
            "mobile": target_user.mobile
        }
    )

@router.post("/biometric/toggle")
def toggle_biometric(
    req: BiometricToggleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.biometric_enabled = req.enabled
    db.commit()
    return {
        "success": True,
        "biometric_enabled": current_user.biometric_enabled,
        "message": f"Biometric login {'enabled' if req.enabled else 'disabled'}"
    }

@router.get("/biometric/status", response_model=BiometricStatusResponse)
def get_biometric_status(
    email_or_mobile: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    from app.models.webauthn import WebAuthnCredential

    user = current_user
    if not user and email_or_mobile:
        user = db.query(User).filter(
            (User.email == email_or_mobile.strip()) | (User.mobile == email_or_mobile.strip())
        ).first()

    if not user:
        return BiometricStatusResponse(
            biometric_enabled=False,
            credentials_count=0,
            device_names=[]
        )

    creds = db.query(WebAuthnCredential).filter(
        WebAuthnCredential.user_id == user.id,
        WebAuthnCredential.is_active == True
    ).all()

    return BiometricStatusResponse(
        biometric_enabled=bool(user.biometric_enabled),
        credentials_count=len(creds),
        device_names=[c.device_name or "Device" for c in creds]
    )
