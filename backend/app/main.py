from __future__ import annotations

"""Qeemat Backend — FastAPI Application Entry Point.

Run with:
    uvicorn app.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.services.firebase_service import init_firebase
from app.db import init_db, close_pool
from app.routers import products, auth, favorites, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle."""
    # Startup: initialize Firebase
    init_firebase()
    print("✅ Firebase Admin SDK initialized")
    print(f"📦 Project: {get_settings().firebase_project_id}")
    print(f"🌐 CORS origins: {get_settings().cors_origins_list}")
    if get_settings().database_url:
        await init_db()
        print("🗄️ Database initialized")
    else:
        print("⚠️ DATABASE_URL not set. Database-backed endpoints will fail until configured.")

    yield

    # Shutdown: cleanup
    print("🛑 Shutting down Qeemat Backend")
    await close_pool()


app = FastAPI(
    title="Qeemat API",
    description="Backend API for Qeemat — Pakistan's grocery & pharmaceutical price comparison app.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(products.router)
app.include_router(auth.router)
app.include_router(favorites.router)
app.include_router(analytics.router)


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "service": "Qeemat API",
        "status": "healthy",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "firebase_project": settings.firebase_project_id,
        "endpoints": {
            "products": "/api/products",
            "auth": "/api/auth",
            "favorites": "/api/favorites",
            "analytics": "/api/analytics",
        },
    }
