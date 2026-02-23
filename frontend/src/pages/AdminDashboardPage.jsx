import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Loader, User, ShieldCheck } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getPendingLibrarians, approveLibrarian, rejectLibrarian } from "../lib/adminApi";
import BackButton from "../components/BackButton";

const AdminDashboardPage = () => {
    const { token } = useAuth();
    const [librarians, setLibrarians] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        const fetchLibrarians = async () => {
            try {
                const response = await getPendingLibrarians(token);
                setLibrarians(response.data || []);
            } catch (err) {
                setError(err.message || "Failed to load pending librarians.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchLibrarians();
    }, [token]);

    const handleApprove = async (id) => {
        setProcessingId(id);
        try {
            await approveLibrarian(id, token);
            setLibrarians((prev) => prev.filter((lib) => lib._id !== id));
        } catch (err) {
            alert(err.message || "Failed to approve librarian.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Are you sure you want to reject and delete this librarian account request?")) return;

        setProcessingId(id);
        try {
            await rejectLibrarian(id, token);
            setLibrarians((prev) => prev.filter((lib) => lib._id !== id));
        } catch (err) {
            alert(err.message || "Failed to reject librarian.");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <BackButton className="!static mb-6" />
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-500/15 rounded-lg">
                            <ShieldCheck className="size-6 text-rose-400" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    </div>
                    <p className="text-zinc-500 text-sm">Review and approve new librarian account requests.</p>
                </div>

                {isLoading && (
                    <div className="flex justify-center py-20">
                        <Loader className="size-8 text-rose-400 animate-spin" />
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-6">
                        {error}
                    </div>
                )}

                {!isLoading && !error && librarians.length === 0 && (
                    <div className="text-center py-20 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl">
                        <ShieldCheck className="size-16 text-zinc-700 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-semibold text-zinc-400 mb-2">No pending requests</h3>
                        <p className="text-zinc-600 text-sm">All librarian accounts have been reviewed.</p>
                    </div>
                )}

                {!isLoading && librarians.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <AnimatePresence>
                            {librarians.map((lib) => (
                                <motion.div
                                    key={lib._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                    className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col gap-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                            <User className="size-5 text-indigo-400" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <h3 className="font-semibold text-white truncate" title={lib.name}>{lib.name}</h3>
                                            <p className="text-sm text-zinc-400 truncate" title={lib.email}>{lib.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-zinc-800/50">
                                        <button
                                            onClick={() => handleApprove(lib._id)}
                                            disabled={processingId === lib._id}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 hover:border-green-500/40 rounded-xl text-sm font-medium transition-all focus:outline-none disabled:opacity-50"
                                        >
                                            {processingId === lib._id ? <Loader className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(lib._id)}
                                            disabled={processingId === lib._id}
                                            className="flex items-center justify-center p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all focus:outline-none disabled:opacity-50"
                                            title="Reject & Delete"
                                        >
                                            <XCircle className="size-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboardPage;
