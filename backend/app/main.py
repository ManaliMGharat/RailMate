from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import Base, engine
from app.routers import (
    auth, users, stations, trains, bookings, pnr,
    tickets, food, support, refunds, wallet, notifications, admin
)

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="RailMate - Mobile-first Railway Journey Super-App REST API"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global custom error handler for uniform API error responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Pass through standard HTTPException if status_code exists
    if hasattr(exc, "status_code"):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": getattr(exc, "detail", str(exc)),
                "error_code": "API_ERROR"
            }
        )
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error occurred.",
            "detail": str(exc),
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(stations.router, prefix=settings.API_V1_STR)
app.include_router(trains.router, prefix=settings.API_V1_STR)
app.include_router(bookings.router, prefix=settings.API_V1_STR)
app.include_router(pnr.router, prefix=settings.API_V1_STR)
app.include_router(tickets.router, prefix=settings.API_V1_STR)
app.include_router(food.router, prefix=settings.API_V1_STR)
app.include_router(support.router, prefix=settings.API_V1_STR)
app.include_router(refunds.router, prefix=settings.API_V1_STR)
app.include_router(wallet.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "name": "RailMate API",
        "tagline": "Your journey, simplified.",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "status": "online",
        "demo_mode": True,
        "notice": "Demo data — not live railway information"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "railmate-backend"}
