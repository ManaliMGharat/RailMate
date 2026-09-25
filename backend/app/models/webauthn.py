from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class WebAuthnCredential(Base):
    __tablename__ = "webauthn_credentials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    credential_id = Column(String(500), unique=True, index=True, nullable=False) # Base64URL credential ID
    public_key = Column(Text, nullable=False) # Base64URL or COSE public key
    sign_count = Column(Integer, default=0)
    transports = Column(String(255), nullable=True) # e.g. "internal,hybrid"
    device_name = Column(String(255), default="Biometric Platform Authenticator")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="webauthn_credentials")
