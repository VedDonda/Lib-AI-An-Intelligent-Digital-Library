"""
RAG Chain Service
Orchestrates the retrieval + LLM generation pipeline using LangChain and Gemini.
"""

from typing import List, Optional
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.schema import Document
from app.prompts import QA_SYSTEM_PROMPT
from app.services.vectorstore import similarity_search
from app.core.config import settings

def get_llm():
    """Initialize and return the Google Gemini API (Stable)."""
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", 
        temperature=0.3,
        google_api_key=os.getenv("GOOGLE_API_KEY") or settings.GOOGLE_API_KEY
    )


def format_chat_history(chat_history: Optional[List[dict]] = None) -> str:
    """Format chat history into a string for the prompt."""
    if not chat_history:
        return "No previous conversation."

    formatted = []
    for msg in chat_history[-6:]:  # Keep last 6 messages (3 exchanges)
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "user":
            formatted.append(f"Student: {content}")
        else:
            formatted.append(f"Assistant: {content}")

    return "\n".join(formatted)


def format_context(documents: List[Document]) -> str:
    """Format retrieved documents into a context string with page references."""
    context_parts = []

    for i, doc in enumerate(documents, 1):
        page = doc.metadata.get("page", "unknown")
        doc_type = doc.metadata.get("type", "text")
        prefix = f"[Page {page}]"

        if doc_type == "image_caption":
            prefix = f"[Image from Page {page}]"

        context_parts.append(f"{prefix}\n{doc.page_content}")

    return "\n\n---\n\n".join(context_parts)


async def get_answer(
    book_id: str,
    question: str,
    chat_history: Optional[List[dict]] = None
) -> dict:
    """
    Main RAG pipeline:
    1. Retrieve relevant chunks from FAISS
    2. Build prompt with context + question + history
    3. Send to Gemini and return the answer
    """
    # Step 1: Retrieve relevant chunks
    relevant_docs = similarity_search(book_id, question, k=5)

    if not relevant_docs:
        return {
            "answer": "I couldn't find any relevant information in this book for your question. Please try a different question.",
            "sourcePages": []
        }

    # Step 2: Format context and build prompt
    context = format_context(relevant_docs)
    history_str = format_chat_history(chat_history)

    prompt_template = PromptTemplate(
        input_variables=["context", "chat_history", "question"],
        template=QA_SYSTEM_PROMPT
    )

    formatted_prompt = prompt_template.format(
        context=context,
        chat_history=history_str,
        question=question
    )
    print(formatted_prompt)
    # Step 3: Get answer from Stable Gemini API
    llm = get_llm()
    response = await llm.ainvoke(formatted_prompt)
    answer_text = response.content

    # Extract unique page numbers from sources
    source_pages = sorted(set(
        doc.metadata.get("page", 0)
        for doc in relevant_docs
        if doc.metadata.get("page", 0) > 0
    ))

    return {
        "answer": answer_text,
        "sourcePages": source_pages
    }
