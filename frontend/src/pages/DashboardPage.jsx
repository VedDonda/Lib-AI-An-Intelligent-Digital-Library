import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, Loader, User } from "lucide-react";
import { Link } from "react-router-dom";
import { getAllBooks } from "../lib/bookApi";
import Navbar from "../components/Navbar";

const DashboardPage = () => {
    const [books, setBooks] = useState([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

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
    }, []);

    const filteredBooks = books.filter(
        (book) =>
            book.title.toLowerCase().includes(search.toLowerCase()) ||
            book.author.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Digital Library</h1>
                    <p className="text-zinc-500 text-sm">Browse and read books from your college library — anytime, anywhere.</p>
                </div>

                {/* Search */}
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

                {/* Loading */}
                {isLoading && (
                    <div className="flex items-center justify-center py-32">
                        <Loader className="size-8 text-purple-400 animate-spin" />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <p className="text-center text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 max-w-md mx-auto">{error}</p>
                )}

                {/* Empty State */}
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

                {/* Book Grid */}
                {!isLoading && !error && filteredBooks.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        {filteredBooks.map((book, index) => (
                            <motion.div
                                key={book._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                            >
                                <Link
                                    to={`/books/${book._id}`}
                                    className="group block bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-900/10 transition-all duration-300"
                                >
                                    {/* Cover */}
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
                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                            <span className="text-sm font-medium text-purple-300">Read Book →</span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 mb-1.5 group-hover:text-purple-300 transition-colors">
                                            {book.title}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                            <User className="size-3" />
                                            <span className="line-clamp-1">{book.author}</span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
