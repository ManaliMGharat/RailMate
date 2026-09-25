from typing import Optional
from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    mobile: Optional[str] = None
    full_name: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class RefreshRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

# mPIN Schemas
class MPINSetRequest(BaseModel):
    mpin: str

class MPINVerifyRequest(BaseModel):
    email_or_mobile: Optional[str] = None
    mpin: str

class MPINChangeRequest(BaseModel):
    old_mpin: str
    new_mpin: str

class MPINToggleRequest(BaseModel):
    enabled: bool

class MPINStatusResponse(BaseModel):
    mpin_enabled: bool
    has_mpin: bool
    is_locked: bool
    locked_until: Optional[str] = None
    attempts_remaining: int

# WebAuthn Biometric Schemas
class BiometricChallengeResponse(BaseModel):
    challenge: str
    rp_id: str
    rp_name: str
    user_id: str
    user_name: str
    user_display_name: str

class BiometricRegisterRequest(BaseModel):
    credential_id: str
    public_key: str
    device_name: Optional[str] = "Primary Device"
    transports: Optional[str] = "internal"

class BiometricLoginRequest(BaseModel):
    email_or_mobile: Optional[str] = None
    credential_id: str
    authenticator_data: Optional[str] = None
    client_data_json: Optional[str] = None
    signature: Optional[str] = None

class BiometricToggleRequest(BaseModel):
    enabled: bool

class BiometricStatusResponse(BaseModel):
    biometric_enabled: bool
    credentials_count: int
    device_names: list[str] = []

# Phone Verification & OTP Schemas
class SendPhoneOTPRequest(BaseModel):
    phone_number: str

class VerifyPhoneOTPRequest(BaseModel):
    phone_number: str
    otp: str

class PhoneOTPResponse(BaseModel):
    success: bool
    message: str
    demo_otp: Optional[str] = None
    expires_in_seconds: Optional[int] = 300

