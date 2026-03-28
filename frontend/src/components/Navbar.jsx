import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Plus, Library, ShieldCheck, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const handleLogout = async () => {
        setMenuOpen(false);
        await logout();
        navigate("/login");
    };

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const initials = user?.name?.charAt(0)?.toUpperCase() || "?";

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

                        {/* Avatar + Dropdown */}
                        {user && (
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setMenuOpen((prev) => !prev)}
                                    className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-sm hover:bg-purple-500 transition-colors cursor-pointer select-none"
                                    title={user.name}
                                >
                                    {initials}
                                </button>

                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700/60 rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                        {/* Profile section */}
                                        <div className="px-4 py-3 border-b border-zinc-700/40">
                                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                            <p className="text-xs text-zinc-400 capitalize mt-0.5">{user.role}</p>
                                        </div>

                                        {/* Menu items */}
                                        <div className="py-1">
                                            <button
                                                onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                                            >
                                                <User className="size-4" />
                                                Profile
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
                                            >
                                                <LogOut className="size-4" />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
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
