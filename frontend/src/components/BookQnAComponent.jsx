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
    BookOpen,
} from "lucide-react";
import { ingestBook, askBook, checkIngestionStatus } from "../lib/aiApi";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const BookQnAComponent = ({ bookId, book, onClose, onPageClick }) => {
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

        let pollInterval = null;

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

                let polls = 0;
                const MAX_POLLS = 60;

                pollInterval = setInterval(async () => {
                    polls++;
                    try {
                        const s = await checkIngestionStatus(bookId);
                        if (s.isIngested) {
                            setIngestionStatus("ready");
                            clearInterval(pollInterval);
                        } else if (polls >= MAX_POLLS) {
                            clearInterval(pollInterval);
                            setIngestionStatus("error");
                        }
                    } catch {
                    }
                }, 5000);
            } catch (err) {
                console.error("Ingestion error:", err);
                setIngestionStatus("error");
            }
        };

        startIngestion();

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
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
        <div className="flex flex-col h-full bg-[#050505] text-white border-l border-zinc-800/50 relative">
            <div className="flex items-center justify-between px-5 h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-800/50 z-10 sticky top-0 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30">
                        <Sparkles className="size-4 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Ask AI</h2>
                        <p className="text-[11px] text-purple-400 font-medium tracking-wide mt-0.5 truncate max-w-[120px]">Book knowledge assistant</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer shadow-none"
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
                        className="overflow-hidden shrink-0 px-4 pt-4"
                    >
                        <div
                            className={`px-4 py-3 text-[11px] font-medium flex items-center justify-center gap-3 rounded-xl border backdrop-blur-sm ${
                                ingestionStatus === "error"
                                    ? "bg-red-500/10 border-red-500/20 text-red-400 shadow-lg shadow-red-900/10"
                                    : "bg-indigo-500/10 border-indigo-500/20 text-indigo-300 shadow-lg shadow-indigo-900/10"
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

            <div className="flex-1 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:hover:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full pb-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center w-full"
                        >
                            <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all">
                                <Sparkles className="size-8 text-purple-400 drop-shadow-md" />
                            </div>
                            <h2 className="text-xl font-bold mb-2 tracking-tight text-zinc-100">Talk to this Book</h2>
                            <p className="text-zinc-500 text-[11px] font-medium mb-8 max-w-[200px] mx-auto leading-relaxed">
                                Get instant, highly accurate AI answers with exact page references.
                            </p>

                            <div className="space-y-2.5 w-full text-left max-w-[240px] mx-auto">
                                {[
                                    { text: "What are the core concepts?", icon: FileText },
                                    { text: "Provide a detailed summary", icon: BookOpen },
                                    { text: "What is the most important takeaway?", icon: Sparkles },
                                ].map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (ingestionStatus === "ready") {
                                                setInput(q.text);
                                                inputRef.current?.focus();
                                            }
                                        }}
                                        disabled={ingestionStatus !== "ready"}
                                        className="group w-full flex items-center gap-3 px-4 py-3 text-xs bg-zinc-900/40 border border-zinc-800/80 rounded-xl hover:border-purple-500/40 hover:bg-zinc-800/60 hover:shadow-lg hover:shadow-purple-900/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-zinc-400 hover:text-zinc-200 cursor-pointer"
                                    >
                                        <q.icon className="size-4 flex-shrink-0 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                                        <span className="font-medium">{q.text}</span>
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
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm ${
                                            msg.isError
                                                ? "bg-red-500/10 border border-red-500/20"
                                                : "bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30"
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
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                                        msg.role === "user"
                                            ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-sm shadow-purple-900/20"
                                            : msg.isError
                                            ? "bg-red-500/10 border border-red-500/20 text-red-300 rounded-tl-sm"
                                            : "bg-zinc-900/90 border border-zinc-800/80 text-zinc-200 rounded-tl-sm backdrop-blur-sm"
                                    }`}
                                >
                                    {msg.role === "assistant" && !msg.isError ? (
                                        <div className="text-[13px] leading-relaxed markdown-body overflow-x-auto text-zinc-300">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm, remarkMath]}
                                                rehypePlugins={[rehypeKatex]}
                                                components={{
                                                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                                                    li: ({node, ...props}) => <li className="mb-0.5" {...props} />,
                                                    h1: ({node, ...props}) => <h1 className="text-sm font-bold mt-3 mb-1" {...props} />,
                                                    h2: ({node, ...props}) => <h2 className="text-xs font-bold mt-3 mb-1" {...props} />,
                                                    h3: ({node, ...props}) => <h3 className="text-xs font-semibold mt-2 mb-1" {...props} />,
                                                    code: ({node, inline, ...props}) => (
                                                        inline 
                                                            ? <code className="bg-zinc-800 text-purple-300 px-1 py-0.5 rounded text-[10px]" {...props} />
                                                            : <code className="block bg-zinc-800 p-2 rounded-md my-2 overflow-x-auto text-[10px]" {...props} />
                                                    ),
                                                    a: ({node, ...props}) => <a className="text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap font-medium">
                                            {msg.content}
                                        </p>
                                    )}

                                    {/* Source pages */}
                                    {msg.sourcePages && msg.sourcePages.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-zinc-800/60 items-center">
                                            <FileText className="size-3 text-zinc-500" />
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mr-1">Sources:</span>
                                            {msg.sourcePages.map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => onPageClick && onPageClick(Number(page))}
                                                    className="text-[10px] font-bold px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/30 hover:scale-105 transition-all cursor-pointer shadow-sm"
                                                >
                                                    P{page}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {msg.role === "user" && (
                                    <div className="w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700/80 shadow-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <User className="size-4 text-zinc-400" />
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

            <div className="p-4 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent shrink-0">
                <form
                    onSubmit={handleSubmit}
                    className="flex items-center gap-2 p-1.5 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl shadow-xl shadow-black/40 backdrop-blur-xl focus-within:border-purple-500/50 focus-within:ring-4 focus-within:ring-purple-500/10 transition-all"
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            ingestionStatus === "ready"
                                ? "Ask about this book..."
                                : "Awaiting processing..."
                        }
                        disabled={ingestionStatus !== "ready" || isSending}
                        className="flex-1 px-3 py-2.5 bg-transparent border-none text-xs md:text-sm text-white placeholder-zinc-500 font-medium focus:outline-none focus:ring-0 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={
                            !input.trim() || isSending || ingestionStatus !== "ready"
                        }
                        className="p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:from-purple-600 disabled:hover:to-indigo-600 shadow-md flex-shrink-0 cursor-pointer"
                    >
                        {isSending ? (
                            <Loader className="size-4 animate-spin" />
                        ) : (
                            <Send className="size-4 md:size-5 ml-0.5" />
                        )}
                    </button>
                </form>
                <p className="text-center text-[10px] text-zinc-600 mt-3 font-medium">
                    AI generated answers. Always verify important information.
                </p>
            </div>
        </div>
    );
};

export default BookQnAComponent;
