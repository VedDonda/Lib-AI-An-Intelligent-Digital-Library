import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Loader, ZoomIn, ZoomOut, Sparkles } from "lucide-react";
import BackButton from "../components/BackButton";
import { getBook } from "../lib/bookApi";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const BookReaderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.2);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [pageInput, setPageInput] = useState("1");
    const [isPageLoading, setIsPageLoading] = useState(true);

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
    }, [id]);

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
        <div
            className="flex flex-col h-screen bg-[#0a0a0a] text-white"
        >
            <div className="flex items-center justify-between px-4 h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-800/50">
                <div className="flex items-center gap-3">
                    <BackButton className="!static" onClick={() => navigate("/dashboard")} />
                    <div>
                        <h1 className="text-sm font-semibold leading-tight line-clamp-1">{book?.title}</h1>
                        <p className="text-xs text-zinc-500">{book?.author}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Zoom out"
                    >
                        <ZoomOut className="size-4" />
                    </button>
                    <span className="text-xs text-zinc-500 w-12 text-center">{Math.round(scale * 100)}%</span>
                    <button
                        onClick={() => setScale((s) => Math.min(3, s + 0.2))}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Zoom in"
                    >
                        <ZoomIn className="size-4" />
                    </button>

                    <div className="w-px h-6 bg-zinc-800 mx-1" />

                    <button
                        onClick={() => goToPage(pageNumber - 1)}
                        disabled={pageNumber <= 1}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="size-4" />
                    </button>

                    <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5">
                        <input
                            type="text"
                            value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)}
                            className="w-12 text-center bg-zinc-800 border border-zinc-700 rounded-md py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                        <span className="text-xs text-zinc-500">/ {numPages || "?"}</span>
                    </form>

                    <button
                        onClick={() => goToPage(pageNumber + 1)}
                        disabled={pageNumber >= (numPages || 1)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="size-4" />
                    </button>

                    <div className="w-px h-6 bg-zinc-800 mx-1" />

                    <Link
                        to={`/books/${id}/ask`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-purple-600/80 hover:bg-purple-500 rounded-lg text-xs font-medium text-white transition-colors"
                        title="Ask this Book with AI"
                    >
                        <Sparkles className="size-3.5" />
                        Ask AI
                    </Link>
                </div>
            </div>

            <div className="flex-1 overflow-auto flex justify-center py-6 px-4 bg-[#111111] relative">
                {isPageLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#111111]">
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
    );
};

export default BookReaderPage;
