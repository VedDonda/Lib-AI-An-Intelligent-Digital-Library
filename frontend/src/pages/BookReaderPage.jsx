import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Loader, ZoomIn, ZoomOut, Sparkles, BookOpen } from "lucide-react";
import { Panel, Group, Separator } from "react-resizable-panels";
import BackButton from "../components/BackButton";
import BookQnAComponent from "../components/BookQnAComponent";
import { getBook, addToHistory } from "../lib/bookApi";
import { useAuth } from "../context/AuthContext";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const BookReaderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = useAuth();
    const [book, setBook] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.2);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [pageInput, setPageInput] = useState("1");
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isAiMode, setIsAiMode] = useState(() => {
        const params = new URLSearchParams(location.search);
        return params.get("ask") === "true";
    });

    useEffect(() => {
        setIsPageLoading(true);
    }, [pageNumber]);

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
        
        if (id && token) {
            addToHistory(id, token).catch(console.error);
        }
    }, [id, token]);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const goToPage = (page) => {
        const p = Math.max(1, Math.min(page, numPages || 1));
        setPageNumber(p);
        setPageInput(String(p));
    };

    const handlePageInputSubmit = (e) => {
        e.preventDefault();
        const p = parseInt(pageInput);
        if (!isNaN(p)) goToPage(p);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                goToPage(pageNumber + 1);
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                goToPage(pageNumber - 1);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [pageNumber, numPages]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#050505]">
                <Loader className="size-8 text-purple-400 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#050505] text-white gap-4">
                <p className="text-red-400">{error}</p>
                <Link to="/dashboard" className="text-purple-400 hover:text-purple-300">← Back to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
            <Group orientation="horizontal">
                <Panel minSize={30} defaultSize={isAiMode ? 65 : 100}>
                    <div className="flex flex-col h-full bg-[#111111]">
                        <div className="flex items-center justify-between px-4 sm:px-6 h-16 shrink-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-800/50 z-10 relative">
                <div className="flex items-center gap-4">
                    <BackButton className="!static bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800/60" onClick={() => navigate("/dashboard")} />
                    <div className="h-8 w-px bg-zinc-800/60 hidden sm:block"></div>
                    <div className="flex items-center gap-3">
                        {book?.coverImage ? (
                            <img src={book.coverImage} alt="Cover" className="w-8 h-10 rounded flex-shrink-0 object-cover border border-zinc-700/50 shadow-sm hidden sm:block" />
                        ) : (
                            <div className="w-8 h-10 rounded flex-shrink-0 bg-zinc-800 border border-zinc-700/50 shadow-sm hidden sm:flex items-center justify-center">
                                <BookOpen className="size-4 text-zinc-500" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-sm font-bold text-white leading-tight line-clamp-1 break-all max-w-[150px] md:max-w-xs">{book?.title || "Loading..."}</h1>
                            <p className="text-[11px] text-purple-400 font-medium tracking-wide mt-0.5">{book?.author}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Zoom Controls */}
                    <div className="hidden md:flex items-center gap-1 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-1 shadow-inner">
                        <button
                            onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Zoom out"
                        >
                            <ZoomOut className="size-4" />
                        </button>
                        <span className="text-[11px] font-medium text-zinc-400 w-10 text-center select-none">{Math.round(scale * 100)}%</span>
                        <button
                            onClick={() => setScale((s) => Math.min(3, s + 0.2))}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Zoom in"
                        >
                            <ZoomIn className="size-4" />
                        </button>
                    </div>

                    {/* Page Controls */}
                    <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-1 shadow-inner">
                        <button
                            onClick={() => goToPage(pageNumber - 1)}
                            disabled={pageNumber <= 1}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronLeft className="size-4" />
                        </button>

                        <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5 px-1">
                            <input
                                type="text"
                                value={pageInput}
                                onChange={(e) => setPageInput(e.target.value)}
                                className="w-10 text-center bg-zinc-800 border border-zinc-700/50 rounded-md py-1 text-xs font-medium text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                            />
                            <span className="text-[11px] font-medium text-zinc-500 select-none">/ {numPages || "?"}</span>
                        </form>

                        <button
                            onClick={() => goToPage(pageNumber + 1)}
                            disabled={pageNumber >= (numPages || 1)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>

                    {!isAiMode && (
                        <button
                            onClick={() => setIsAiMode(true)}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 ml-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95 border border-purple-500/30 cursor-pointer"
                            title="Ask this Book with AI"
                        >
                            <Sparkles className="size-4" />
                            Ask AI
                        </button>
                    )}
                </div>
            </div>

                        <div className="flex-1 overflow-auto flex justify-center py-6 px-4 relative">
                            {isPageLoading && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#111111]/80 backdrop-blur-sm">
                                    <Loader className="size-8 text-purple-400 animate-spin" />
                                </div>
                            )}
                            {book?.pdfUrl && (
                                <Document
                                    file={book.pdfUrl}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    loading={
                                        <div className="flex items-center justify-center py-32">
                                            <Loader className="size-8 text-purple-400 animate-spin" />
                                        </div>
                                    }
                                    error={
                                        <div className="text-center py-32">
                                            <p className="text-red-400 mb-2">Failed to load PDF</p>
                                            <p className="text-xs text-zinc-600">The file may be corrupted or inaccessible.</p>
                                        </div>
                                    }
                                >
                                    <Page
                                        pageNumber={pageNumber}
                                        scale={scale}
                                        className="shadow-2xl shadow-black/50 rounded-lg overflow-hidden"
                                        renderAnnotationLayer={true}
                                        renderTextLayer={true}
                                        onLoadSuccess={() => setIsPageLoading(false)}
                                    />
                                </Document>
                            )}
                        </div>
                    </div>
                </Panel>

                    {isAiMode && (
                        <>
                            <Separator className="w-1.5 bg-zinc-800/50 hover:bg-purple-500/50 transition-colors cursor-col-resize active:bg-purple-500 z-20" />
                            <Panel minSize={20} defaultSize={35}>
                                <BookQnAComponent bookId={id} book={book} onClose={() => setIsAiMode(false)} onPageClick={goToPage} />
                            </Panel>
                        </>
                    )}
                </Group>
        </div>
    );
};

export default BookReaderPage;
