const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || "http://localhost:8001";

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.detail || data?.message || "AI service request failed");
    }
    return data;
};

/**
 * Trigger ingestion of a book's PDF into the vector store.
 * Runs in background on the server — returns immediately.
 */
export const ingestBook = async (bookId, pdfUrl) => {
    const response = await fetch(`${AI_BASE_URL}/api/ai/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, pdfUrl }),
    });
    return handleResponse(response);
};

/**
 * Check if a book has been ingested (FAISS index exists).
 */
export const checkIngestionStatus = async (bookId) => {
    const response = await fetch(`${AI_BASE_URL}/api/ai/status/${bookId}`);
    return handleResponse(response);
};

/**
 * Ask a question about a specific book.
 * @param {string} bookId - The MongoDB _id of the book
 * @param {string} question - The user's question
 * @param {Array} chatHistory - Previous messages [{role, content}]
 */
export const askBook = async (bookId, question, chatHistory = []) => {
    const response = await fetch(`${AI_BASE_URL}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, question, chatHistory }),
    });
    return handleResponse(response);
};

/**
 * Health check for the AI service.
 */
export const checkAiHealth = async () => {
    const response = await fetch(`${AI_BASE_URL}/api/ai/health`);
    return handleResponse(response);
};
