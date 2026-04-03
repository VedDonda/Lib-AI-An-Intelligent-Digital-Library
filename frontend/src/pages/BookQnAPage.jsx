import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send,
    Loader,
    BookOpen,
    ArrowLeft,
    Sparkles,
    Bot,
    User,
    FileText,
    AlertCircle,
} from "lucide-react";
import { getBook } from "../lib/bookApi";
import { ingestBook, askBook, checkIngestionStatus } from "../lib/aiApi";

const BookQnAPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [book, setBook] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [ingestionStatus, setIngestionStatus] = useState("checking"); // checking | ingesting | ready | error
    const [error, setError] = useState("");

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom on new messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch book details on mount
    useEffect(() => {
        const fetchBook = async () => {
            try {
                const response = await getBook(id);
                setBook(response.data);
            } catch (err) {
                setError(err.message || "Failed to load book");
            } finally {
                setIsLoading(false);
            }
        };
        fetchBook();
    }, [id]);

    // Start ingestion when book is loaded
    useEffect(() => {
        if (!book) return;

        const startIngestion = async () => {
            try {
                setIngestionStatus("checking");

                // Check if already ingested
                const status = await checkIngestionStatus(id);
                if (status.isIngested) {
                    setIngestionStatus("ready");
                    return;
                }

                // Start ingestion
                setIngestionStatus("ingesting");
                await ingestBook(id, book.pdfUrl);

                // Poll for completion
                const pollInterval = setInterval(async () => {
                    try {
                        const s = await checkIngestionStatus(id);
                        if (s.isIngested) {
                            setIngestionStatus("ready");
                            clearInterval(pollInterval);
                        }
                    } catch {
                        // Keep polling
                    }
                }, 3000);

                // Stop polling after 5 minutes
                setTimeout(() => {
                    clearInterval(pollInterval);
                    if (ingestionStatus !== "ready") {
                        setIngestionStatus("error");
                    }
                }, 300000);
            } catch (err) {
                console.error("Ingestion error:", err);
                setIngestionStatus("error");
            }
        };

        startIngestion();
    }, [book]);

    // Send a question
    const handleSubmit = async (e) => {
        e.preventDefault();
        const question = input.trim();
        if (!question || isSending || ingestionStatus !== "ready") return;

        // Add user message
        const userMessage = { role: "user", content: question };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsSending(true);

        try {
            // Build chat history (excluding the current question)
            const chatHistory = messages.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const response = await askBook(id, question, chatHistory);

            // Add assistant message
            const assistantMessage = {
                role: "assistant",
                content: response.answer,
                sourcePages: response.sourcePages || [],
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err) {
            const errorMessage = {
                role: "assistant",
                content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
                isError: true,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#050505]">
                <Loader className="size-8 text-purple-400 animate-spin" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#050505] text-white gap-4">
                <AlertCircle className="size-12 text-red-400" />
                <p className="text-red-400">{error}</p>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                    ← Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#050505] text-white">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#0a0a0a] border-b border-zinc-800/50">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="size-5" />
                </button>

                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {book?.coverImage ? (
                        <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-8 h-10 rounded object-cover"
                        />
                    ) : (
                        <div className="w-8 h-10 rounded bg-zinc-800 flex items-center justify-center">
                            <BookOpen className="size-4 text-zinc-600" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h1 className="text-sm font-semibold leading-tight truncate">
                            {book?.title}
                        </h1>
                        <p className="text-xs text-zinc-500 truncate">{book?.author}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-purple-400" />
                    <span className="text-xs font-medium text-purple-400">AI Q&A</span>
                </div>
            </div>

            {/* Ingestion status banner */}
            <AnimatePresence>
                {ingestionStatus !== "ready" && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div
                            className={`px-4 py-3 text-sm flex items-center gap-3 ${
                                ingestionStatus === "error"
                                    ? "bg-red-500/10 border-b border-red-500/20 text-red-400"
                                    : "bg-purple-500/10 border-b border-purple-500/20 text-purple-300"
                            }`}
                        >
                            {ingestionStatus === "checking" && (
                                <>
                                    <Loader className="size-4 animate-spin" />
                                    Checking if the book is ready...
                                </>
                            )}
                            {ingestionStatus === "ingesting" && (
                                <>
                                    <Loader className="size-4 animate-spin" />
                                    Processing the book for AI Q&A. This may take a minute for large books...
                                </>
                            )}
                            {ingestionStatus === "error" && (
                                <>
                                    <AlertCircle className="size-4" />
                                    Failed to process the book. Please refresh and try again.
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center h-full px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center max-w-md"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="size-8 text-purple-400" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Ask this Book</h2>
                            <p className="text-zinc-500 text-sm mb-8">
                                Ask any question about{" "}
                                <span className="text-purple-400 font-medium">
                                    "{book?.title}"
                                </span>{" "}
                                and get AI-powered answers with page references.
                            </p>

                            {/* Suggested questions */}
                            <div className="space-y-2">
                                {[
                                    "What are the main topics covered in this book?",
                                    "Summarize the key concepts from this book",
                                    "What is the most important takeaway?",
                                ].map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (ingestionStatus === "ready") {
                                                setInput(q);
                                                inputRef.current?.focus();
                                            }
                                        }}
                                        disabled={ingestionStatus !== "ready"}
                                        className="w-full text-left px-4 py-3 text-sm bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-purple-500/30 hover:bg-zinc-800/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-zinc-400 hover:text-zinc-200"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    /* Chat messages */
                    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                        {messages.map((msg, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 ${
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                }`}
                            >
                                {msg.role === "assistant" && (
                                    <div
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                            msg.isError
                                                ? "bg-red-500/10 border border-red-500/20"
                                                : "bg-purple-500/10 border border-purple-500/20"
                                        }`}
                                    >
                                        <Bot
                                            className={`size-4 ${
                                                msg.isError ? "text-red-400" : "text-purple-400"
                                            }`}
                                        />
                                    </div>
                                )}

                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                        msg.role === "user"
                                            ? "bg-purple-600 text-white"
                                            : msg.isError
                                            ? "bg-red-500/10 border border-red-500/20 text-red-300"
                                            : "bg-zinc-900 border border-zinc-800 text-zinc-200"
                                    }`}
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </p>

                                    {/* Source pages */}
                                    {msg.sourcePages && msg.sourcePages.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-zinc-700/50">
                                            <FileText className="size-3.5 text-zinc-500 mt-0.5" />
                                            <span className="text-xs text-zinc-500">Sources:</span>
                                            {msg.sourcePages.map((page) => (
                                                <span
                                                    key={page}
                                                    className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                                >
                                                    Page {page}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {msg.role === "user" && (
                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                                        <User className="size-4 text-zinc-400" />
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {/* Typing indicator */}
                        {isSending && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex gap-3"
                            >
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                                    <Bot className="size-4 text-purple-400" />
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input area */}
            <div className="border-t border-zinc-800/50 bg-[#0a0a0a] px-4 py-4">
                <form
                    onSubmit={handleSubmit}
                    className="max-w-3xl mx-auto flex items-center gap-3"
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            ingestionStatus === "ready"
                                ? "Ask a question about this book..."
                                : "Waiting for book to be processed..."
                        }
                        disabled={ingestionStatus !== "ready" || isSending}
                        className="flex-1 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={
                            !input.trim() || isSending || ingestionStatus !== "ready"
                        }
                        className="p-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
                    >
                        {isSending ? (
                            <Loader className="size-5 animate-spin" />
                        ) : (
                            <Send className="size-5" />
                        )}
                    </button>
                </form>
                <p className="text-center text-xs text-zinc-600 mt-2 max-w-3xl mx-auto">
                    AI answers are generated from the book content. Always verify important information.
                </p>
            </div>
        </div>
    );
};

export default BookQnAPage;
