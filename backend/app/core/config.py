import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RailOne API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "railmate-super-secret-jwt-key-2026-production-ready")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    
    _raw_db: str = os.getenv("DATABASE_URL", "sqlite:///./railmate.db")
    if _raw_db.startswith("postgres://"):
        _raw_db = _raw_db.replace("postgres://", "postgresql://", 1)
    DATABASE_URL: str = _raw_db
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://rail-mate-ochre.vercel.app",
    ]

    def get_cors_origins(self) -> list[str]:
        origins = list(self.BACKEND_CORS_ORIGINS)
        extra = os.getenv("BACKEND_CORS_ORIGINS") or os.getenv("CORS_ORIGINS")
        if extra:
            for o in extra.split(","):
                o = o.strip()
                if o and o not in origins:
                    origins.append(o)
        # Filter out wildcard '*' to comply with CORS spec when credentials are used
        return [o for o in origins if o != "*"]

    class Config:
        case_sensitive = True

settings = Settings()
