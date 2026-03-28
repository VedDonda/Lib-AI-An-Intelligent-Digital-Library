import { Link, useNavigate } from "react-router-dom";
import { BookOpen, LogOut, Plus, Library, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-800/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/dashboard" className="flex items-center gap-2.5 group">
                        <div className="bg-purple-500/15 p-2 rounded-lg group-hover:bg-purple-500/25 transition-colors">
                            <Library className="size-5 text-purple-400" />
                        </div>
                        <span className="text-lg font-bold tracking-wide text-white">LibAI</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        {user?.role === "admin" && (
                            <Link
                                to="/admin-dashboard"
                                className="flex items-center gap-2 px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-sm font-medium rounded-xl border border-rose-500/20 hover:border-rose-500/40 transition-all"
                            >
                                <ShieldCheck className="size-4" />
                                <span className="hidden sm:inline">Admin Dashboard</span>
                            </Link>
                        )}

                        {(user?.role === "librarian" || user?.role === "admin") && (
                            <Link
                                to="/add-book"
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-sm font-medium rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all"
                            >
                                <Plus className="size-4" />
                                <span className="hidden sm:inline">Add Book</span>
                            </Link>
                        )}

                        {user && (
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-medium text-white leading-tight">{user.name}</p>
                                    <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="size-5" />
                                </button>
                            </div>
                        )}

                        {!user && (
                            <Link
                                to="/login"
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
