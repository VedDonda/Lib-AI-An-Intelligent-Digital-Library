import asyncio
import uuid
from typing import List

from langchain.schema import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import PointStruct

from app.core.config import settings

_embeddings = None


def get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        print("Initializing HuggingFace embeddings (first use)...")
        _embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"model_kwargs": {"low_cpu_mem_usage": False}},
        )
        print("Embeddings ready: sentence-transformers/all-MiniLM-L6-v2")
    return _embeddings


def get_qdrant_client() -> QdrantClient:
    return QdrantClient(
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY,
        check_compatibility=False,
        timeout=30  # Add timeout to Qdrant operations
    )


def _collection_exists(client: QdrantClient, collection_name: str) -> bool:
    try:
        existing = [c.name for c in client.get_collections().collections]
        return collection_name in existing
    except Exception as e:
        print(f"Error checking collection: {e}")
        return False


def _ensure_collection(client: QdrantClient, collection_name: str):
    if not _collection_exists(client, collection_name):
        try:
            client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=384,
                    distance=models.Distance.COSINE
                )
            )
            print(f"Created Qdrant collection: {collection_name}")
        except Exception as e:
            print(f"Error creating collection: {e}")


def _ensure_payload_indexes(client: QdrantClient):
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


def is_book_ingested(book_id: str) -> bool:
    try:
        client = get_qdrant_client()
        if not _collection_exists(client, "books"):
            return False

        _ensure_payload_indexes(client)

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
    if not chunks:
        print("No chunks to index")
        return 0

    for chunk in chunks:
        chunk.metadata["book_id"] = book_id

    client = get_qdrant_client()
    embeddings = get_embeddings()

    _ensure_collection(client, "books")

    texts = [chunk.page_content for chunk in chunks]
    metadatas = [chunk.metadata for chunk in chunks]
    vectors = embeddings.embed_documents(texts)

    batch_size = 100
    for i in range(0, len(chunks), batch_size):
        batch_vectors = vectors[i:i + batch_size]
        batch_texts = texts[i:i + batch_size]
        batch_metadatas = metadatas[i:i + batch_size]

        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=batch_vectors[j],
                payload={
                    "page_content": batch_texts[j],
                    "metadata": batch_metadatas[j]
                }
            )
            for j in range(len(batch_vectors))
        ]
        client.upsert(collection_name="books", points=points)

    _ensure_payload_indexes(client)
    print(f"Qdrant index updated for book: {book_id} ({len(chunks)} vectors)")
    return len(chunks)


def similarity_search(book_id: str, query: str, k: int = 5, target_pages: List[int] = None) -> List[Document]:
    """Synchronous wrapper for vector search - blocking call"""
    try:
        client = get_qdrant_client()
        embeddings = get_embeddings()

        search_query = query if query.strip() else "content"
        query_vector = embeddings.embed_query(search_query)

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
            k = max(k, len(target_pages) * 20)

        search_filter = models.Filter(must=filter_conditions)

        results = client.query_points(
            collection_name="books",
            query=query_vector,
            query_filter=search_filter,
            limit=k
        ).points

        documents = [
            Document(
                page_content=r.payload["page_content"],
                metadata=r.payload["metadata"]
            )
            for r in results
        ]

        pages = sorted(set(doc.metadata.get("page", 0) for doc in documents))
        print(f"Found {len(documents)} relevant chunks from pages: {pages} for book {book_id}")

        return documents
    except Exception as e:
        print(f"Error in similarity_search: {e}")
        return []