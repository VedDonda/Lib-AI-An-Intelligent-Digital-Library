from pydantic import BaseModel
from typing import List, Optional


class IngestRequest(BaseModel):
    """Request body for the /ingest endpoint."""
    bookId: str
    pdfUrl: str


class IngestResponse(BaseModel):
    """Response body for the /ingest endpoint."""
    message: str
    bookId: str
    totalChunks: int = 0


class ChatMessage(BaseModel):
    """A single chat message (for history)."""
    role: str  # "user" or "assistant"
    content: str


class AskRequest(BaseModel):
    """Request body for the /ask endpoint."""
    bookId: str
    question: str
    chatHistory: Optional[List[ChatMessage]] = []


class AskResponse(BaseModel):
    """Response body for the /ask endpoint."""
    answer: str
    sourcePages: List[int] = []


class HealthResponse(BaseModel):
    """Response body for the /health endpoint."""
    status: str
    message: str


class IngestStatusResponse(BaseModel):
    """Response body for checking ingestion status."""
    bookId: str
    isIngested: bool
