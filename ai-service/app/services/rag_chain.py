"""
RAG Chain Service
Orchestrates the retrieval + LLM generation pipeline using LangChain and Gemini.
"""

from typing import List, Optional
import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.schema import Document
from app.prompts import QA_SYSTEM_PROMPT, QUERY_PLANNER_PROMPT
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


async def get_search_params(llm, question: str) -> dict:
    """Uses the LLM to parse the user's question into searchable parameters."""
    prompt_template = PromptTemplate(
        input_variables=["question"],
        template=QUERY_PLANNER_PROMPT
    )
    formatted = prompt_template.format(question=question)
    response = await llm.ainvoke(formatted)
    text = response.content.strip()
    
    # Strip markdown code blocks if the LLM adds them
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
        
    try:
        return json.loads(text.strip())
    except Exception as e:
        print(f"Failed to parse query planner JSON: {e}")
        return {"semantic_query": question, "target_pages": []}


async def get_answer(
    book_id: str,
    question: str,
    chat_history: Optional[List[dict]] = None
) -> dict:
    """
    Main RAG pipeline:
    1. Agentic Planner decides search strategy
    2. Retrieve relevant chunks from Vector DB (with optional metadata filtering)
    3. Send to Gemini and return the answer (with general knowledge fallback)
    """
    llm = get_llm()
    
    # Step 1: LLM Planner decides how to search
    params = await get_search_params(llm, question)
    semantic_query = params.get("semantic_query", "")
    target_pages = params.get("target_pages", [])
    
    # Fallback to the full question if everything is completely empty
    if not semantic_query.strip() and not target_pages:
        semantic_query = question

    # Step 2: Retrieve relevant chunks dynamically based on the plan
    relevant_docs = similarity_search(book_id, semantic_query, k=5, target_pages=target_pages)

    # Step 3: Format context and build prompt
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
    # Step 4: Get answer from Stable Gemini API
    # The llm object is already retrieved above
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
