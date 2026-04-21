"""
AI Service — FastAPI Entry Point
RAG-based Book Q&A System for Digital Library
"""

import os
from dotenv import load_dotenv

# Fix for "OMP: Error #15" Windows libomp multi-thread collision
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Load .env before anything else
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router

app = FastAPI(
    title="Digital Library AI Service",
    description="RAG-based Book Q&A System — Ask questions about any book in the library",
    version="1.0.0"
)

# Build allowed origins list — hardcoded + optional extras from env
_extra = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    "https://lib-ai-library.vercel.app",
] + _extra

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["*"],
    max_age=3600,
)

# Mount API routes under /api/ai
app.include_router(api_router, prefix="/api/ai", tags=["RAG"])


@app.get("/")
def root():
    return {
        "service": "Digital Library AI Service",
        "status": "running",
        "docs": "/docs"
    }