import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    ChevronRight,
    LayoutDashboard,
    BookPlus,
    ShieldCheck,
    User,
    LogOut,
    Bookmark,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [expanded, setExpanded] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const isAdmin = user?.role === "admin";
    const isLibrarianOrAdmin = user?.role === "librarian" || user?.role === "admin";

    const navItems = [
        {
            icon: LayoutDashboard,
            label: "Dashboard",
            to: "/dashboard",
            show: true,
        },
        {
            icon: BookPlus,
            label: "Add Book",
            to: "/add-book",
            show: isLibrarianOrAdmin,
        },
        {
            icon: ShieldCheck,
            label: "Admin Dashboard",
            to: "/admin-dashboard",
            show: isAdmin,
            accent: "rose",
        },
        {
            icon: User,
            label: "Profile",
            to: "/profile",
            show: !!user,
        },
        {
            icon: Bookmark,
            label: "Bookmarks",
            to: "/bookmarks",
            show: !!user,
        },
    ];

    const activeItems = navItems.filter((i) => i.show);

    return (
        <aside
            className={`
                h-full flex flex-col bg-[#0a0a0a] border-r border-zinc-800/50
                transition-all duration-300 ease-in-out flex-shrink-0
                ${expanded ? "w-56" : "w-14"}
            `}
        >
            {/* Toggle button */}
            <div className={`flex items-center h-16 border-b border-zinc-800/50 px-3 ${expanded ? "justify-end" : "justify-center"}`}>
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700/50 transition-all"
                    title={expanded ? "Collapse sidebar" : "Expand sidebar"}
                >
                    <ChevronRight
                        className={`size-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                    />
                </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 flex flex-col gap-1 py-3 px-2 overflow-hidden">
                {activeItems.map(({ icon: Icon, label, to, accent }) => {
                    const isActive = location.pathname === to;
                    const colorClass =
                        accent === "rose"
                            ? isActive
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "text-zinc-400 hover:bg-rose-500/10 hover:text-rose-300"
                            : isActive
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "text-zinc-400 hover:bg-zinc-800 hover:text-white";

                    return (
                        <Link
                            key={to}
                            to={to}
                            title={!expanded ? label : undefined}
                            className={`
                                flex items-center gap-3 rounded-xl px-2 py-2.5 transition-all duration-150
                                ${colorClass}
                                ${expanded ? "justify-start" : "justify-center"}
                            `}
                        >
                            <Icon className="size-5 flex-shrink-0" />
                            {expanded && (
                                <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                                    {label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User info + Logout at bottom */}
            {user && (
                <div className="border-t border-zinc-800/50 px-2 py-3 flex flex-col gap-1">
                    {expanded && (
                        <div className="px-2 py-1.5 mb-1">
                            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                            <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        title={!expanded ? "Logout" : undefined}
                        className={`
                            flex items-center gap-3 rounded-xl px-2 py-2.5 text-red-400
                            hover:bg-red-500/10 hover:text-red-300 transition-all
                            ${expanded ? "justify-start" : "justify-center"}
                        `}
                    >
                        <LogOut className="size-5 flex-shrink-0" />
                        {expanded && <span className="text-sm font-medium">Logout</span>}
                    </button>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
