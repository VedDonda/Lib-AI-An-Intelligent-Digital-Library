import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Image, Loader, CheckCircle, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { uploadBook } from "../lib/bookApi";
import Navbar from "../components/Navbar";
import BackButton from "../components/BackButton";

const AddBookPage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [description, setDescription] = useState("");
    const [pdfFile, setPdfFile] = useState(null);
    const [coverImage, setCoverImage] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const pdfInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverImage(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!title.trim() || !author.trim()) {
            setError("Title and author are required.");
            return;
        }
        if (!pdfFile) {
            setError("Please select a PDF file.");
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("title", title.trim());
            formData.append("author", author.trim());
            formData.append("description", description.trim());
            formData.append("pdfFile", pdfFile);
            if (coverImage) {
                formData.append("coverImage", coverImage);
            }

            await uploadBook(formData, token);
            setSuccess("Book uploaded successfully!");
            setTimeout(() => navigate("/dashboard"), 1200);
        } catch (err) {
            setError(err.message || "Failed to upload book.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden">
            <Navbar />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                    <BackButton className="!static mb-6" onClick={() => navigate(-1)} />
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Add New Book</h1>
                        <p className="text-zinc-500 text-sm">Upload a book to the digital library for students to access.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                        )}
                        {success && (
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2"
                            >
                                <CheckCircle className="size-4" />
                                <span>{success}</span>
                            </motion.div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-400 ml-1">Book Title *</label>
                            <input
                                type="text"
                                placeholder="e.g. Operating System Concepts"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-400 ml-1">Author *</label>
                            <input
                                type="text"
                                placeholder="e.g. Abraham Silberschatz"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-400 ml-1">Description</label>
                            <textarea
                                placeholder="Short description of the book..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div
                                onClick={() => pdfInputRef.current?.click()}
                                className="cursor-pointer border-2 border-dashed border-zinc-700 hover:border-purple-500/40 rounded-2xl p-6 text-center transition-colors group"
                            >
                                <input
                                    ref={pdfInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setPdfFile(e.target.files[0])}
                                    className="hidden"
                                />
                                <div className="flex flex-col items-center gap-2">
                                    {pdfFile ? (
                                        <>
                                            <FileText className="size-10 text-purple-400" />
                                            <p className="text-xs text-purple-300 font-medium line-clamp-2">{pdfFile.name}</p>
                                            <p className="text-xs text-zinc-600">{(pdfFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="size-10 text-zinc-600 group-hover:text-purple-400 transition-colors" />
                                            <p className="text-xs text-zinc-500">Upload PDF *</p>
                                            <p className="text-xs text-zinc-700">Max 50MB</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div
                                onClick={() => coverInputRef.current?.click()}
                                className="cursor-pointer border-2 border-dashed border-zinc-700 hover:border-purple-500/40 rounded-2xl p-6 text-center transition-colors group overflow-hidden"
                            >
                                <input
                                    ref={coverInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCoverChange}
                                    className="hidden"
                                />
                                <div className="flex flex-col items-center gap-2">
                                    {coverPreview ? (
                                        <img src={coverPreview} alt="Cover preview" className="w-20 h-28 object-cover rounded-lg" />
                                    ) : (
                                        <>
                                            <Image className="size-10 text-zinc-600 group-hover:text-purple-400 transition-colors" />
                                            <p className="text-xs text-zinc-500">Cover Image</p>
                                            <p className="text-xs text-zinc-700">Optional</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition duration-200"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : "Upload Book"}
                        </motion.button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddBookPage;
