"""
SentinelAI — FastAPI Backend Entry Point
"""
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.core.database import connect_db, close_db
from app.api import moderation, stream, forensics, offenders, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    await stream.start_stream()
    yield
    await close_db()


app = FastAPI(
    title="SentinelAI",
    description="AI-Powered Real-Time Social Media Harassment Detection & Digital Forensics Platform",
    version="2.0.0",
    lifespan=lifespan,
    # Disable docs in production
    docs_url="/docs" if os.getenv("APP_ENV", "development") == "development" else None,
    redoc_url=None,
)

# ── Security: Restrict CORS to known frontend origins only ───────────────────
# Do NOT use ["*"] in any environment — it allows any site to call this API
ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:4173",   # Vite preview
    "http://127.0.0.1:5173",
    "http://localhost:3000",   # CRA / Next fallback
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,   # False unless session cookies are needed
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
)


# ── Security: Add standard security headers to every response ─────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


# Include routers
app.include_router(moderation.router)
app.include_router(stream.router)
app.include_router(forensics.router)
app.include_router(offenders.router)
app.include_router(analytics.router)


@app.get("/")
async def root():
    return {
        "service": "SentinelAI Backend",
        "version": "2.0.0",
        "status": "operational",
        "docs": "/docs" if os.getenv("APP_ENV", "development") == "development" else "disabled",
    }
