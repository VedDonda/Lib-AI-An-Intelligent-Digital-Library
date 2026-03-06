import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader, BookOpen, User, AlignLeft } from "lucide-react";
import { updateBook } from "../lib/bookApi";
import BackButton from "./BackButton";

const EditBookModal = ({ isOpen, onClose, book, token, onSuccess }) => {
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [description, setDescription] = useState("");
    const [coverImage, setCoverImage] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (book) {
            setTitle(book.title || "");
            setAuthor(book.author || "");
            setDescription(book.description || "");
            setCoverPreview(book.coverImage || null);
            setCoverImage(null);
            setError("");
        }
    }, [book, isOpen]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError("Image must be less than 5MB");
                return;
            }
            if (!file.type.startsWith("image/")) {
                setError("File must be an image");
                return;
            }

            setCoverImage(file);
            setCoverPreview(URL.createObjectURL(file));
            setError("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!title.trim() || !author.trim()) {
            setError("Title and author are required");
            return;
        }

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append("title", title.trim());
            formData.append("author", author.trim());
            formData.append("description", description.trim());

            if (coverImage) {
                formData.append("coverImage", coverImage);
            }

            await updateBook(book._id, formData, token);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || "Failed to update book");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-[#0a0a0a] border border-zinc-800/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center gap-4 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-10">
                        <BackButton onClick={onClose} className="static p-2" title="Close" />
                        <h2 className="text-xl font-semibold text-white">Edit Book Details</h2>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        <form id="edit-book-form" onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Cover Image
                                    </label>
                                    <div className="relative aspect-[3/4] bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-xl overflow-hidden group hover:border-purple-500/50 transition-colors">
                                        {coverPreview ? (
                                            <img
                                                src={coverPreview}
                                                alt="Cover preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
                                                <Upload className="size-8 mb-2 group-hover:text-purple-400 transition-colors" />
                                                <span className="text-xs">Upload new cover</span>
                                                <span className="text-[10px] text-zinc-600 mt-1">
                                                    (Optional, max 5MB)
                                                </span>
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-sm font-medium text-white px-3 py-1.5 bg-black/50 rounded-lg backdrop-blur-sm">
                                                Change Image
                                            </span>
                                        </div>

                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
                                            <BookOpen className="size-4" /> Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium"
                                            placeholder="Enter book title"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
                                            <User className="size-4" /> Author *
                                        </label>
                                        <input
                                            type="text"
                                            value={author}
                                            onChange={(e) => setAuthor(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                            placeholder="Enter author name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-zinc-300 mb-1.5 flex items-center gap-2">
                                            <AlignLeft className="size-4" /> Description
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows="4"
                                            className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm resize-none custom-scrollbar"
                                            placeholder="Add a brief description..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="px-6 py-4 border-t border-zinc-800/60 bg-zinc-900/30 flex justify-end shrink-0">
                        <button
                            type="submit"
                            form="edit-book-form"
                            disabled={isSubmitting || !title.trim() || !author.trim()}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader className="size-4 animate-spin" /> Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EditBookModal;
