"""
Vector Store Service
Manages Qdrant collections — creating, setting metadata, and querying.
Uses HuggingFace sentence-transformers locally to prevent API rate limits.
"""

from typing import List
from langchain.schema import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http import models

from app.core.config import settings

# Initialize Hugging Face Local Embeddings - This downloads the model locally on first run!
print("Initializing Hugging Face Local Embeddings...")
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)
print("Embeddings loaded locally: sentence-transformers/all-MiniLM-L6-v2")


def get_qdrant_client() -> QdrantClient:
    """Helper to get the Qdrant client."""
    return QdrantClient(
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY
    )


def is_book_ingested(book_id: str) -> bool:
    """Check if vectors for this book exist in the Qdrant collection."""
    try:
        client = get_qdrant_client()
        if not client.collection_exists("books"):
            return False
            
        try:
            client.create_payload_index(
                collection_name="books",
                field_name="metadata.book_id",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
            client.create_payload_index(
                collection_name="books",
                field_name="metadata.page",
                field_schema=models.PayloadSchemaType.INTEGER,
            )
        except Exception:
            pass
            
        count_result = client.count(
            collection_name="books",
            count_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="metadata.book_id",
                        match=models.MatchValue(value=book_id)
                    )
                ]
            )
        )
        return count_result.count > 0
    except Exception as e:
        print(f"Error checking ingestion status: {e}")
        return False


def chunk_documents(documents: List[Document]) -> List[Document]:
    """
    Split documents into chunks using RecursiveCharacterTextSplitter.
    Set to chunk_size=1000 and overlap=200 for better balance.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )

    chunks = text_splitter.split_documents(documents)
    print(f"Split into {len(chunks)} chunks (chunk_size=1000, overlap=200)")
    return chunks


def create_vector_store(book_id: str, chunks: List[Document]) -> int:
    """
    Tag chunks with book_id and insert them into Qdrant.
    """
    if not chunks:
        print("No chunks to index")
        return 0

    # Ensure every chunk has the book_id in its metadata
    for chunk in chunks:
        chunk.metadata["book_id"] = book_id

    QdrantVectorStore.from_documents(
        documents=chunks,
        embedding=embeddings,
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY,
        collection_name="books"
    )

    try:
        client = get_qdrant_client()
        client.create_payload_index(
            collection_name="books",
            field_name="metadata.book_id",
            field_schema=models.PayloadSchemaType.KEYWORD,
        )
        client.create_payload_index(
            collection_name="books",
            field_name="metadata.page",
            field_schema=models.PayloadSchemaType.INTEGER,
        )
    except Exception:
        pass

    print(f"Qdrant index updated for book: {book_id} ({len(chunks)} vectors)")
    return len(chunks)


def similarity_search(book_id: str, query: str, k: int = 5, target_pages: List[int] = None) -> List[Document]:
    """
    Search the Qdrant index for the most relevant chunks, filtered by book_id and optionally target_pages.
    """
    qdrant = QdrantVectorStore.from_existing_collection(
        embedding=embeddings,
        collection_name="books",
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY
    )

    filter_conditions = [
        models.FieldCondition(
            key="metadata.book_id",
            match=models.MatchValue(value=book_id)
        )
    ]
    
    if target_pages:
        filter_conditions.append(
            models.FieldCondition(
                key="metadata.page",
                match=models.MatchAny(any=target_pages)
            )
        )
        # Increase limit drastically so we grab the entire page(s) not just a few chunks
        k = max(k, len(target_pages) * 20)

    filter = models.Filter(must=filter_conditions)

    # Empty queries will fail in some vector engines, provide a fallback "content" query if routing isolated pages
    search_query = query if query.strip() else "content"
    
    results = qdrant.similarity_search(search_query, k=k, filter=filter)

    pages = sorted(set(doc.metadata.get("page", 0) for doc in results))
    print(f"Found {len(results)} relevant chunks from pages: {pages} for book {book_id}")

    return results
