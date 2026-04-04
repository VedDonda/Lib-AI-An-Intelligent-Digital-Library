import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { User, ArrowLeft, BookOpen, Shield, Calendar, Plus, Bookmark, Clock, Upload, Loader, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { getReadHistory, getUserUploads } from "../lib/bookApi";

const ProfilePage = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [history, setHistory] = useState([]);
    const [uploads, setUploads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !token) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [historyRes, uploadsRes] = await Promise.allSettled([
                    getReadHistory(token),
                    // Only fetch uploads for librarian/admin
                    user.role !== "student" ? getUserUploads(token) : Promise.resolve({ data: [] })
                ]);

                if (historyRes.status === "fulfilled") setHistory(historyRes.value.data);
                if (uploadsRes.status === "fulfilled") setUploads(uploadsRes.value.data);
            } catch (err) {
                console.error("Failed to fetch profile data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, token]);

    if (!user) {
        navigate("/login");
        return null;
    }

    const initials = user.name?.charAt(0)?.toUpperCase() || "?";
    const memberSince = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
        : "N/A";

    const BookList = ({ title, icon: Icon, books, fallbackText }) => {
        if (!books || books.length === 0) {
            return (
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <Icon className="size-5 text-purple-400" />
                        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
                    </div>
                    <div className="p-12 border border-zinc-800/60 rounded-2xl bg-zinc-900/30 flex flex-col items-center justify-center text-center">
                        <BookOpen className="size-12 text-zinc-700 mx-auto mb-3" />
                        <p className="text-zinc-500 text-sm">{fallbackText}</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="mb-12 w-full overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                    <Icon className="size-5 text-purple-400" />
                    <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
                </div>
                {/* Horizontal Scroll Container */}
                <div className="flex gap-5 overflow-x-auto pb-6 px-1 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-zinc-900/50 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:hover:bg-zinc-600 [&::-webkit-scrollbar-thumb]:rounded-full transition-all">
                    {books.map((book, index) => (
                        <motion.div
                            key={book._id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex-shrink-0 w-40 sm:w-48"
                        >
                            <div
                                onClick={() => navigate(`/books/${book._id}`)}
                                className="group block bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-900/20 transition-all duration-300 relative cursor-pointer"
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
                                            <BookOpen className="size-10 text-zinc-600 mb-2" />
                                            <span className="text-[10px] text-zinc-600 font-medium">No Cover</span>
                                        </div>
                                    )}
                                    
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                        <div className="flex flex-col gap-2 w-full">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/books/${book._id}?ask=true`);
                                                }}
                                                className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-purple-600/90 hover:bg-purple-500 rounded-lg text-xs font-semibold text-white backdrop-blur-md transition-colors"
                                                title="Ask this Book with AI"
                                            >
                                                <Sparkles className="size-3.5" />
                                                Ask AI
                                            </button>
                                            <span className="text-xs font-medium text-purple-300 text-center pb-1">Read Book →</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 mb-1.5 group-hover:text-purple-300 transition-colors">
                                        {book.title}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                        <User className="size-3" />
                                        <span className="line-clamp-1">{book.author}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="text-white flex flex-col min-h-full">
            <Navbar title="Profile" />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8 cursor-pointer w-fit group"
                >
                    <div className="p-1 rounded-md group-hover:bg-zinc-800 transition-colors">
                        <ArrowLeft className="size-4" />
                    </div>
                    Back to previous
                </button>

                <div className="flex flex-col gap-10">
                    {/* Top Section: Profile Banner */}
                    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
                        <div className="h-32 md:h-40 bg-gradient-to-br from-purple-600/40 via-indigo-600/20 to-zinc-900 relative">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay opacity-30"></div>
                        </div>
                        <div className="px-6 md:px-10 pb-8 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 -mt-16 md:-mt-20 relative z-10">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-black border-[6px] border-[#0c0c0c] shadow-xl flex-shrink-0">
                                {initials}
                            </div>
                            <div className="flex flex-col items-center md:items-start flex-1 w-full mt-4 md:mt-16 text-center md:text-left">
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">{user.name}</h1>
                                <span className="inline-flex items-center px-4 py-1.5 text-sm font-semibold rounded-full bg-purple-500/15 text-purple-300 capitalize border border-purple-500/30">
                                    {user.role} Account
                                </span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto mt-4 md:mt-16">
                                <div className="flex items-center gap-4 bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/40 w-full md:w-auto">
                                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                                        <User className="size-5 text-zinc-400" />
                                    </div>
                                    <div className="text-left w-full">
                                        <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Full Name</p>
                                        <p className="text-sm font-medium text-white">{user.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/40 w-full md:w-auto">
                                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                                        <Calendar className="size-5 text-zinc-400" />
                                    </div>
                                    <div className="text-left w-full">
                                        <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Member Since</p>
                                        <p className="text-sm font-medium text-white">{memberSince}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: Quick Actions Grid */}
                    <div>
                        <h3 className="text-base font-bold text-white mb-4 px-1">Quick Actions</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Link to="/dashboard" className="flex flex-col items-center justify-center gap-3 p-6 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl hover:border-purple-500/40 hover:bg-zinc-800/40 hover:shadow-lg hover:shadow-purple-900/10 transition-all group">
                                <div className="p-4 bg-purple-500/10 rounded-2xl group-hover:bg-purple-500/20 group-hover:scale-110 transition-all">
                                    <BookOpen className="size-6 text-purple-400" />
                                </div>
                                <span className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">Browse Library</span>
                            </Link>

                            <Link to="/bookmarks" className="flex flex-col items-center justify-center gap-3 p-6 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl hover:border-yellow-500/40 hover:bg-zinc-800/40 hover:shadow-lg hover:shadow-yellow-900/10 transition-all group">
                                <div className="p-4 bg-yellow-500/10 rounded-2xl group-hover:bg-yellow-500/20 group-hover:scale-110 transition-all">
                                    <Bookmark className="size-6 text-yellow-400" />
                                </div>
                                <span className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">Your Bookmarks</span>
                            </Link>

                            {user.role !== "student" && (
                                <Link to="/add-book" className="flex flex-col items-center justify-center gap-3 p-6 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl hover:border-indigo-500/40 hover:bg-zinc-800/40 hover:shadow-lg hover:shadow-indigo-900/10 transition-all group">
                                    <div className="p-4 bg-indigo-500/10 rounded-2xl group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all">
                                        <Plus className="size-6 text-indigo-400" />
                                    </div>
                                    <span className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">Upload a Book</span>
                                </Link>
                            )}

                            {user.role === "admin" && (
                                <Link to="/admin-dashboard" className="flex flex-col items-center justify-center gap-3 p-6 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl hover:border-rose-500/40 hover:bg-zinc-800/40 hover:shadow-lg hover:shadow-rose-900/10 transition-all group">
                                    <div className="p-4 bg-rose-500/10 rounded-2xl group-hover:bg-rose-500/20 group-hover:scale-110 transition-all">
                                        <Shield className="size-6 text-rose-400" />
                                    </div>
                                    <span className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">Admin Panel</span>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Bottom Section: Dynamic Content Feeds */}
                    <div className="pt-2 border-t border-zinc-800/50">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-4">
                                <Loader className="size-8 text-purple-500 animate-spin" />
                                <p className="text-sm font-medium text-zinc-500">Loading your library data...</p>
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="space-y-6"
                            >
                                <BookList 
                                    title="Continue Reading" 
                                    icon={Clock} 
                                    books={history} 
                                    fallbackText="You haven't read any books yet. Once you open a book, it will appear here." 
                                />

                                {user.role !== "student" && (
                                    <BookList 
                                        title="Your Uploads" 
                                        icon={Upload} 
                                        books={uploads} 
                                        fallbackText="You haven't uploaded any books to the library yet." 
                                    />
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
