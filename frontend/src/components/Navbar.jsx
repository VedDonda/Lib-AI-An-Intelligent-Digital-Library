import { Link } from "react-router-dom";

const Navbar = ({ title, subtitle, icon: Icon, iconColor, iconBg }) => {
    return (
        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-800/50">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center h-16">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className={`p-1.5 rounded-lg ${iconBg || "bg-purple-500/15"}`}>
                                <Icon className={`size-5 ${iconColor || "text-purple-400"}`} />
                            </div>
                        )}
                        <div className="flex flex-col justify-center">
                            <span className="text-lg font-bold tracking-tight text-white leading-tight">{title || "LibAI"}</span>
                            {subtitle && (
                                <span className="text-[11px] text-zinc-400 leading-tight mt-0.5 max-w-sm truncate hidden sm:block">{subtitle}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
