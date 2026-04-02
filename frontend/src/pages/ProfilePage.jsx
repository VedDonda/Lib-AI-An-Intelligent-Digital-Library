import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { User, ArrowLeft, BookOpen, Shield, Calendar, Plus } from "lucide-react";
import Navbar from "../components/Navbar";

const ProfilePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        navigate("/login");
        return null;
    }

    const initials = user.name?.charAt(0)?.toUpperCase() || "?";
    const memberSince = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
        : "N/A";

    return (
        <div className="text-white flex flex-col min-h-full">
            <Navbar title="Profile" />
            <div className="max-w-2xl mx-auto px-4 py-4 w-full flex-1">
                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8 cursor-pointer"
                >
                    <ArrowLeft className="size-4" />
                    Back
                </button>

                {/* Profile card */}
                <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl overflow-hidden">
                    <div className="h-24 bg-gradient-to-r from-purple-600/30 via-indigo-600/20 to-purple-600/10" />

                    <div className="px-6 pb-6 -mt-10">
                        <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-[#050505] shadow-lg">
                            {initials}
                        </div>

                        <div className="mt-4 space-y-4">
                            <div>
                                <h1 className="text-2xl font-bold">{user.name}</h1>
                                <span className="inline-block mt-1.5 px-3 py-1 text-xs font-medium rounded-full bg-purple-500/15 text-purple-300 capitalize border border-purple-500/20">
                                    {user.role}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="border-t border-zinc-800/60 pt-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <User className="size-4 text-zinc-500" />
                                    <div>
                                        <p className="text-xs text-zinc-500">Full Name</p>
                                        <p className="text-sm text-white">{user.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Shield className="size-4 text-zinc-500" />
                                    <div>
                                        <p className="text-xs text-zinc-500">Role</p>
                                        <p className="text-sm text-white capitalize">{user.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="size-4 text-zinc-500" />
                                    <div>
                                        <p className="text-xs text-zinc-500">Member Since</p>
                                        <p className="text-sm text-white">{memberSince}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <h2 className="text-lg font-semibold mt-10 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-3 p-4 bg-zinc-900/50 border border-zinc-800/60 rounded-xl hover:border-purple-500/30 hover:bg-zinc-800/40 transition-all"
                    >
                        <div className="p-2 bg-purple-500/15 rounded-lg">
                            <BookOpen className="size-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Browse Library</p>
                            <p className="text-xs text-zinc-500">Explore and read books</p>
                        </div>
                    </Link>

                    {user.role !== "student" && (
                        <Link
                            to="/add-book"
                            className="flex items-center gap-3 p-4 bg-zinc-900/50 border border-zinc-800/60 rounded-xl hover:border-purple-500/30 hover:bg-zinc-800/40 transition-all"
                        >
                            <div className="p-2 bg-indigo-500/15 rounded-lg">
                                <Plus className="size-5 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Add Book</p>
                                <p className="text-xs text-zinc-500">Upload a new book to the library</p>
                            </div>
                        </Link>
                    )}

                    {user.role === "admin" && (
                        <Link
                            to="/admin-dashboard"
                            className="flex items-center gap-3 p-4 bg-zinc-900/50 border border-zinc-800/60 rounded-xl hover:border-rose-500/30 hover:bg-zinc-800/40 transition-all"
                        >
                            <div className="p-2 bg-rose-500/15 rounded-lg">
                                <Shield className="size-5 text-rose-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Admin Panel</p>
                                <p className="text-xs text-zinc-500">Manage users and approvals</p>
                            </div>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
