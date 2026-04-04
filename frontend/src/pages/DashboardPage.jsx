import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, Loader, User, Trash2, Edit, Bookmark, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getAllBooks, deleteBook, toggleBookmark, getBookmarks } from "../lib/bookApi";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import EditBookModal from "../components/EditBookModal";

const DashboardPage = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    const [editingBook, setEditingBook] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
    const [bookmarkingId, setBookmarkingId] = useState(null);

    const isAdmin = user?.role === "admin";
    const isLibrarian = user?.role === "librarian";

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await getAllBooks();
                setBooks(response.data || []);
            } catch (err) {
                setError(err.message || "Failed to load books");
            } finally {
                setIsLoading(false);
            }
        };
        fetchBooks();

        // Load user's existing bookmarks
        if (user && token) {
            getBookmarks(token)
                .then((res) => {
                    const ids = (res.data || []).map((b) => b._id);
                    setBookmarkedIds(new Set(ids));
                })
                .catch(() => {});
        }
    }, [user, token]);

    const fetchBooks = async () => {
        setIsLoading(true);
        try {
            const response = await getAllBooks();
            setBooks(response.data || []);
        } catch (err) {
            setError(err.message || "Failed to load books");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (e, book) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingBook(book);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        fetchBooks();
    };

    const handleDelete = async (e, bookId, bookTitle) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm(`Are you sure you want to delete "${bookTitle}"? This will remove it from Cloudinary and the database.`)) {
            return;
        }

        try {
            setDeletingId(bookId);
            await deleteBook(bookId, token);
            setBooks((prev) => prev.filter((b) => b._id !== bookId));
        } catch (err) {
            alert(err.message || "Failed to delete book");
        } finally {
            setDeletingId(null);
        }
    };

    const handleBookmark = async (e, bookId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) return;
        setBookmarkingId(bookId);
        try {
            await toggleBookmark(bookId, token);
            setBookmarkedIds((prev) => {
                const next = new Set(prev);
                if (next.has(bookId)) next.delete(bookId);
                else next.add(bookId);
                return next;
            });
        } catch (err) {
            console.error(err);
        } finally {
            setBookmarkingId(null);
        }
    };

    const filteredBooks = books.filter(
        (book) =>
            book.title.toLowerCase().includes(search.toLowerCase()) ||
            book.author.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="text-white flex flex-col min-h-full">
            <Navbar 
                title="Digital Library" 
                subtitle="Browse and read books from your college library - anytime, anywhere." 
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full flex-1">


                    <div className="relative mb-8 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search by title or author..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                    </div>

                    {isLoading && (
                        <div className="flex items-center justify-center py-32">
                            <Loader className="size-8 text-purple-400 animate-spin" />
                        </div>
                    )}

                    {error && (
                        <p className="text-center text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 max-w-md mx-auto">{error}</p>
                    )}

                    {!isLoading && !error && filteredBooks.length === 0 && (
                        <div className="text-center py-32">
                            <BookOpen className="size-16 text-zinc-700 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-zinc-400 mb-2">
                                {search ? "No books match your search" : "No books yet"}
                            </h3>
                            <p className="text-zinc-600 text-sm">
                                {search ? "Try a different search term." : "Books will appear here once a librarian uploads them."}
                            </p>
                        </div>
                    )}

                    {!isLoading && !error && filteredBooks.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                            {filteredBooks.map((book, index) => (
                                <motion.div
                                    key={book._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.04 }}
                                >
                                    <div
                                        onClick={() => navigate(`/books/${book._id}`)}
                                        className="group block bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-900/10 transition-all duration-300 relative cursor-pointer"
                                    >
                                        <div className="aspect-[3/4] bg-zinc-800 overflow-hidden relative">
                                            {book.coverImage ? (
                                                <img
                                                    src={book.coverImage}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                                                    <BookOpen className="size-12 text-zinc-600 mb-2" />
                                                    <span className="text-xs text-zinc-600">No Cover</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="text-sm font-medium text-purple-300">Read Book →</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/books/${book._id}?ask=true`);
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/90 hover:bg-purple-500 rounded-lg text-xs font-medium text-white backdrop-blur-sm transition-colors"
                                                        title="Ask this Book with AI"
                                                    >
                                                        <Sparkles className="size-3.5" />
                                                        Ask AI
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Bookmark button — always visible top-left */}
                                            {user && (
                                                <button
                                                    onClick={(e) => handleBookmark(e, book._id)}
                                                    disabled={bookmarkingId === book._id}
                                                    title={bookmarkedIds.has(book._id) ? "Remove bookmark" : "Bookmark this book"}
                                                    className="absolute top-2 left-2 z-10 p-1.5 rounded-lg backdrop-blur-sm transition-all disabled:opacity-50 cursor-pointer"
                                                >
                                                    <Bookmark
                                                        className={`size-5 transition-all ${
                                                            bookmarkedIds.has(book._id)
                                                                ? "text-purple-400 fill-purple-400"
                                                                : "text-white/60 hover:text-purple-300"
                                                        }`}
                                                    />
                                                </button>
                                            )}
                                        </div>

                                        <div className="p-4">
                                            <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 mb-1.5 group-hover:text-purple-300 transition-colors">
                                                {book.title}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                                <User className="size-3" />
                                                <span className="line-clamp-1">{book.author}</span>
                                            </div>
                                        </div>

                                        {(isAdmin || (isLibrarian && book.uploadedBy?._id === user?._id)) && (
                                            <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                <button
                                                    onClick={(e) => handleEditClick(e, book)}
                                                    className="p-2 bg-purple-500/80 hover:bg-purple-600 rounded-lg text-white backdrop-blur-sm transition-colors cursor-pointer"
                                                    title="Edit book"
                                                >
                                                    <Edit className="size-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, book._id, book.title)}
                                                    disabled={deletingId === book._id}
                                                    className="p-2 bg-red-500/80 hover:bg-red-600 rounded-lg text-white backdrop-blur-sm disabled:opacity-50 cursor-pointer transition-colors"
                                                    title="Delete book"
                                                >
                                                    {deletingId === book._id ? (
                                                        <Loader className="size-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="size-4" />
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            <EditBookModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingBook(null);
                }}
                book={editingBook}
                token={token}
                onSuccess={handleEditSuccess}
            />
        </div>
    );
};

export default DashboardPage;

