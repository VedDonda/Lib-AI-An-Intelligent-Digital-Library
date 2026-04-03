"""
API Endpoints for the RAG service.
Handles document ingestion, querying, and status checks.
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.schemas.models import (
    IngestRequest, IngestResponse,
    AskRequest, AskResponse,
    HealthResponse, IngestStatusResponse
)
from app.services.pdf_loader import (
    download_pdf, extract_text_from_pdf,
    extract_images_from_pdf, cleanup_temp_file
)
from app.services.image_captioner import caption_images
from app.services.vectorstore import (
    chunk_documents, create_vector_store, is_book_ingested
)
from app.services.rag_chain import get_answer

router = APIRouter()


def run_ingestion_pipeline(book_id: str, pdf_url: str):
    """
    Background task: Full ingestion pipeline.
    Downloads PDF → Extracts text → Extracts images → Captions images →
    Chunks everything → Creates FAISS index.
    """
    local_path = None
    try:
        print(f"\n{'='*60}")
        print(f"Starting ingestion for book: {book_id}")
        print(f"{'='*60}")

        # 1. Download PDF from Cloudinary
        local_path = download_pdf(pdf_url)

        # 2. Extract text page-by-page
        text_documents = extract_text_from_pdf(local_path)

        # 3. Disable image captioning for Hugging Face Serverless API compatibility
        # images = extract_images_from_pdf(local_path)
        # image_documents = caption_images(images) if images else []
        image_documents = []

        # 4. Combine text + image caption documents
        all_documents = text_documents + image_documents
        print(f"Total documents: {len(text_documents)} text (images disabled for HF compatibility)")

        # 5. Chunk all documents
        chunks = chunk_documents(all_documents)

        # 6. Create FAISS index
        total_chunks = create_vector_store(book_id, chunks)

        print(f"{'='*60}")
        print(f"Ingestion complete for book: {book_id} ({total_chunks} chunks)")
        print(f"{'='*60}\n")

    except Exception as e:
        print(f"Ingestion failed for book {book_id}: {e}")
        raise

    finally:
        # Clean up temp PDF file
        if local_path:
            cleanup_temp_file(local_path)


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        message="AI service is running"
    )


@router.get("/status/{book_id}", response_model=IngestStatusResponse)
async def check_ingestion_status(book_id: str):
    """Check if a book has been ingested (FAISS index exists)."""
    return IngestStatusResponse(
        bookId=book_id,
        isIngested=is_book_ingested(book_id)
    )


@router.post("/ingest", response_model=IngestResponse)
async def ingest_document(request: IngestRequest, background_tasks: BackgroundTasks):
    """
    Start the ingestion pipeline for a book.
    This runs in the background so the user doesn't wait.
    If already ingested, returns immediately.
    """
    try:
        # Check if already ingested
        if is_book_ingested(request.bookId):
            return IngestResponse(
                message="Book is already ingested and ready for questions.",
                bookId=request.bookId,
                totalChunks=-1  # -1 means already existed
            )

        # Start background ingestion
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
    """
    Ask a question about an ingested book.
    Uses RAG to retrieve relevant chunks and generate an answer.
    """
    try:
        # Check if book is ingested
        if not is_book_ingested(request.bookId):
            raise HTTPException(
                status_code=400,
                detail="This book hasn't been processed yet. Please ingest it first."
            )

        # Convert chat history to list of dicts
        chat_history = [
            {"role": msg.role, "content": msg.content}
            for msg in (request.chatHistory or [])
        ]

        # Get answer from RAG chain
        result = await get_answer(
            book_id=request.bookId,
            question=request.question,
            chat_history=chat_history
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
