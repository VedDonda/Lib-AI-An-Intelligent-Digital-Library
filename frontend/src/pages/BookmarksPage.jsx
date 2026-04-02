import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bookmark, BookOpen, User, Loader } from "lucide-react";
import { getBookmarks } from "../lib/bookApi";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const BookmarksPage = () => {
    const { token } = useAuth();
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getBookmarks(token);
                setBooks(res.data || []);
            } catch (err) {
                setError(err.message || "Failed to load bookmarks");
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, [token]);

    return (
        <div className="text-white flex flex-col min-h-full">
            <Navbar 
                title="Bookmarks" 
                subtitle="Books you've saved for later." 
                // icon={Bookmark} 
                // iconColor="text-purple-400" 
                // iconBg="bg-purple-500/15" 
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full flex-1">


                {isLoading && (
                    <div className="flex justify-center py-32">
                        <Loader className="size-8 text-purple-400 animate-spin" />
                    </div>
                )}

                {error && (
                    <p className="text-center text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 max-w-md mx-auto">{error}</p>
                )}

                {!isLoading && !error && books.length === 0 && (
                    <div className="text-center py-32">
                        <Bookmark className="size-16 text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-zinc-400 mb-2">No bookmarks yet</h3>
                        <p className="text-zinc-600 text-sm mb-6">Click the bookmark icon on any book to save it here.</p>
                        <Link
                            to="/dashboard"
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                            Browse Library
                        </Link>
                    </div>
                )}

                {!isLoading && !error && books.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        {books.map((book) => (
                            <Link
                                key={book._id}
                                to={`/books/${book._id}`}
                                className="group block bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-900/10 transition-all duration-300"
                            >
                                <div className="aspect-[3/4] bg-zinc-800 overflow-hidden">
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
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookmarksPage;
