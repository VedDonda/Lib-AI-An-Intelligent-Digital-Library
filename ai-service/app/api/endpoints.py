from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import JSONResponse
import asyncio
from app.schemas.models import (
    IngestRequest, IngestResponse,
    AskRequest, AskResponse,
    HealthResponse, IngestStatusResponse
)
from app.services.pdf_loader import extract_text_from_pdf_url
from app.services.vectorstore import (
    chunk_documents, create_vector_store, is_book_ingested
)
from app.services.rag_chain import get_answer

router = APIRouter()

# Timeout in seconds for query processing
QUERY_TIMEOUT = 60  # 60 seconds max for query


def run_ingestion_pipeline(book_id: str, pdf_url: str):
    try:
        text_documents = extract_text_from_pdf_url(pdf_url)
        image_documents = []
        all_documents = text_documents + image_documents
        print(f"Total documents: {len(text_documents)} text pages")
        chunks = chunk_documents(all_documents)
        create_vector_store(book_id, chunks)
    except Exception as e:
        print(f"Ingestion failed for book {book_id}: {e}")
        raise


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        message="AI service is running"
    )


@router.get("/status/{book_id}", response_model=IngestStatusResponse)
async def check_ingestion_status(book_id: str):
    return IngestStatusResponse(
        bookId=book_id,
        isIngested=is_book_ingested(book_id)
    )


@router.post("/ingest", response_model=IngestResponse)
async def ingest_document(request: IngestRequest, background_tasks: BackgroundTasks):
    try:
        if is_book_ingested(request.bookId):
            return IngestResponse(
                message="Book is already ingested and ready for questions.",
                bookId=request.bookId,
                totalChunks=-1
            )

        background_tasks.add_task(
            run_ingestion_pipeline,
            request.bookId,
            request.pdfUrl
        )

        return IngestResponse(
            message="Ingestion started. The book will be ready for questions shortly.",
            bookId=request.bookId,
            totalChunks=0
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start ingestion: {str(e)}"
        )


@router.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    try:
        if not is_book_ingested(request.bookId):
            raise HTTPException(
                status_code=400,
                detail="This book hasn't been processed yet. Please ingest it first."
            )

        chat_history = [
            {"role": msg.role, "content": msg.content}
            for msg in (request.chatHistory or [])
        ]

        # Add timeout protection for query processing
        try:
            result = await asyncio.wait_for(
                get_answer(
                    book_id=request.bookId,
                    question=request.question,
                    chat_history=chat_history
                ),
                timeout=QUERY_TIMEOUT
            )
        except asyncio.TimeoutError:
            print(f"Query timeout after {QUERY_TIMEOUT}s for book {request.bookId}")
            raise HTTPException(
                status_code=504,
                detail=f"Query processing took too long. Please try again. (Timeout after {QUERY_TIMEOUT}s)"
            )

        return AskResponse(
            answer=result["answer"],
            sourcePages=result["sourcePages"]
        )

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        from fastapi import status
        if "rate limit" in error_msg.lower() or "too many requests" in error_msg.lower() or "429" in error_msg:
            print("Hugging Face API Rate Limit detected.")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="AI Model provider rate limit reached. Please wait a few moments before asking another question."
            )

        print(f"Error answering question: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process question: {error_msg}"
        )
