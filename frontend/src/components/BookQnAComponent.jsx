import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send,
    Loader,
    Sparkles,
    Bot,
    User,
    FileText,
    AlertCircle,
    X,
} from "lucide-react";
import { ingestBook, askBook, checkIngestionStatus } from "../lib/aiApi";

const BookQnAComponent = ({ bookId, book, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [ingestionStatus, setIngestionStatus] = useState("checking"); // checking | ingesting | ready | error

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!book) return;

        const startIngestion = async () => {
            try {
                setIngestionStatus("checking");

                const status = await checkIngestionStatus(bookId);
                if (status.isIngested) {
                    setIngestionStatus("ready");
                    return;
                }

                setIngestionStatus("ingesting");
                await ingestBook(bookId, book.pdfUrl);

                const pollInterval = setInterval(async () => {
                    try {
                        const s = await checkIngestionStatus(bookId);
                        if (s.isIngested) {
                            setIngestionStatus("ready");
                            clearInterval(pollInterval);
                        }
                    } catch {
                    }
                }, 3000);

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
    }, [book, bookId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const question = input.trim();
        if (!question || isSending || ingestionStatus !== "ready") return;
        const userMessage = { role: "user", content: question };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsSending(true);

        try {
            const chatHistory = messages.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const response = await askBook(bookId, question, chatHistory);

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

    return (
        <div className="flex flex-col h-full bg-[#050505] text-white border-l border-zinc-800/50">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border-b border-zinc-800/50 h-16 shrink-0">
                <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-purple-400" />
                    <span className="text-sm font-medium text-purple-400">Ask AI</span>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Close AI Chat"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {ingestionStatus !== "ready" && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden shrink-0"
                    >
                        <div
                            className={`px-4 py-3 text-xs flex items-center gap-3 ${
                                ingestionStatus === "error"
                                    ? "bg-red-500/10 border-b border-red-500/20 text-red-400"
                                    : "bg-purple-500/10 border-b border-purple-500/20 text-purple-300"
                            }`}
                        >
                            {ingestionStatus === "checking" && (
                                <>
                                    <Loader className="size-4 animate-spin" />
                                    Checking if book is ready...
                                </>
                            )}
                            {ingestionStatus === "ingesting" && (
                                <>
                                    <Loader className="size-4 animate-spin" />
                                    Processing for AI Q&A...
                                </>
                            )}
                            {ingestionStatus === "error" && (
                                <>
                                    <AlertCircle className="size-4" />
                                    Failed to process. Please try again.
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center w-full"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="size-6 text-purple-400" />
                            </div>
                            <h2 className="text-lg font-semibold mb-2">Ask this Book</h2>
                            <p className="text-zinc-500 text-xs mb-6">
                                Get AI-powered answers with page references.
                            </p>

                            <div className="space-y-2 w-full text-left">
                                {[
                                    "Main topics?",
                                    "Summarize key concepts",
                                    "Most important takeaway?",
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
                                        className="w-full text-left px-3 py-2 text-xs bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-purple-500/30 hover:bg-zinc-800/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-zinc-400 hover:text-zinc-200"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <div className="px-4 py-6 space-y-6">
                        {messages.map((msg, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-2.5 ${
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                }`}
                            >
                                {msg.role === "assistant" && (
                                    <div
                                        className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                            msg.isError
                                                ? "bg-red-500/10 border border-red-500/20"
                                                : "bg-purple-500/10 border border-purple-500/20"
                                        }`}
                                    >
                                        <Bot
                                            className={`size-3 ${
                                                msg.isError ? "text-red-400" : "text-purple-400"
                                            }`}
                                        />
                                    </div>
                                )}

                                <div
                                    className={`max-w-[85%] rounded-2xl px-3 py-2.5 ${
                                        msg.role === "user"
                                            ? "bg-purple-600 text-white rounded-tr-sm"
                                            : msg.isError
                                            ? "bg-red-500/10 border border-red-500/20 text-red-300 rounded-tl-sm"
                                            : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm"
                                    }`}
                                >
                                    <p className="text-xs leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </p>

                                    {/* Source pages */}
                                    {msg.sourcePages && msg.sourcePages.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-zinc-700/50">
                                            <FileText className="size-3 text-zinc-500 mt-0.5" />
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Sources:</span>
                                            {msg.sourcePages.map((page) => (
                                                <span
                                                    key={page}
                                                    className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                                >
                                                    P{page}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {msg.role === "user" && (
                                    <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <User className="size-3 text-zinc-400" />
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {isSending && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex gap-2.5"
                            >
                                <div className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Bot className="size-3 text-purple-400" />
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-3 py-2.5">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="border-t border-zinc-800/50 bg-[#0a0a0a] px-3 py-3 shrink-0">
                <form
                    onSubmit={handleSubmit}
                    className="flex items-center gap-2"
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            ingestionStatus === "ready"
                                ? "Ask a question..."
                                : "Waiting for book..."
                        }
                        disabled={ingestionStatus !== "ready" || isSending}
                        className="flex-1 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={
                            !input.trim() || isSending || ingestionStatus !== "ready"
                        }
                        className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
                    >
                        {isSending ? (
                            <Loader className="size-4 animate-spin" />
                        ) : (
                            <Send className="size-4" />
                        )}
                    </button>
                </form>
                <p className="text-center text-[10px] text-zinc-600 mt-2">
                    AI answers are generated from the book. Verify important info.
                </p>
            </div>
        </div>
    );
};

export default BookQnAComponent;
