import { useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    NotebookPen,
    BookOpen,
    Loader2,
    Plus,
    Search,
    X,
    Save,
    AlertCircle,
    ChevronRight,
    Trash2,
    Edit3,
    Clock
} from "lucide-react";
import { useNotes } from "../hooks/useNotes";
import Navbar from "../components/Navbar";
import NoteCard, { timeAgo } from "../components/notes/NoteCard";
import NoteEditor, { NoteEditorStyles } from "../components/notes/NoteEditor";

const NoteModal = ({ note, onClose, onSave, onDelete }) => {
    const [title, setTitle] = useState(note?.title || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    const editorRef = useRef(null);

    const isNew = !note?._id;
    const [mode, setMode] = useState(isNew ? "edit" : "read");

    const handleSave = async () => {
        if (!title.trim()) { setError("Title is required"); return; }
        setIsSaving(true);
        setError("");
        try {
            const content = editorRef.current?.innerHTML || "";
            await onSave({ title: title.trim(), content });
            onClose();
        } catch (err) {
            setError(err.message || "Failed to save note");
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete "${note.title}"? This cannot be undone.`)) return;
        setIsDeleting(true);
        try {
            await onDelete(note._id);
            onClose();
        } catch (err) {
            setError(err.message || "Failed to delete note");
            setIsDeleting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#0a0a0a] border border-zinc-800/70 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-purple-500/15">
                            <NotebookPen className="size-5 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">
                                {isNew ? "Create Note" : (mode === "edit" ? "Edit Note" : note.title)}
                            </h3>
                            {note?.bookId?.title ? (
                                <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                                    <BookOpen className="size-3" />{note.bookId.title}
                                </p>
                            ) : !isNew ? (
                                <p className="text-[10px] text-purple-400/60 mt-0.5 font-medium">Standalone Note</p>
                            ) : null}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {!isNew && note?.bookId?._id && (
                            <Link
                                to={`/books/${note.bookId._id}`}
                                onClick={onClose}
                                className="text-[10px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors px-2.5 py-1.5 bg-zinc-900/60 border border-zinc-800/60 hover:border-purple-500/30 rounded-lg"
                            >
                                Open book <ChevronRight className="size-3" />
                            </Link>
                        )}
                        {!isNew && mode === "read" && (
                            <button
                                onClick={() => setMode("edit")}
                                className="p-2 text-zinc-400 hover:text-purple-400 hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
                                title="Edit note"
                            >
                                <Edit3 className="size-4" />
                            </button>
                        )}
                        {!isNew && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                                title="Delete note"
                            >
                                {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all cursor-pointer">
                            <X className="size-4" />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-6 pt-3 shrink-0">
                            <div className="flex items-center gap-2 px-3 py-2.5 text-[11px] bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
                                <AlertCircle className="size-3.5 flex-shrink-0" /> {error}
                                <button onClick={() => setError("")} className="ml-auto cursor-pointer"><X className="size-3" /></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <NoteEditor
                    title={title}
                    setTitle={setTitle}
                    content={note?.content || ""}
                    editorRef={editorRef}
                    className="flex-1 !border-none !rounded-none"
                    isReadOnly={mode === "read"}
                />

                {mode === "edit" ? (
                    <div className="shrink-0 px-6 py-4 border-t border-zinc-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                            {!isNew && (
                                <>
                                    <Clock className="size-3" />
                                    {timeAgo(note.updatedAt)}
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => isNew ? onClose() : setMode("read")}
                                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 rounded-xl text-white shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer"
                            >
                                {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                                {isNew ? "Create" : "Save"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="shrink-0 px-6 py-4 border-t border-zinc-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                            <Clock className="size-3" />
                            {timeAgo(note.updatedAt)}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => setMode("edit")}
                                className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 rounded-xl text-white shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            >
                                <Edit3 className="size-3.5" />
                                Edit
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
            <style>{NoteEditorStyles}</style>
        </motion.div>
    );
};

const NotesPage = () => {
    const { notes, isLoading, error, addNote, editNote, removeNote } = useNotes();
    const [search, setSearch] = useState("");
    const [activeNote, setActiveNote] = useState(null);

    const grouped = useMemo(() => {
        return notes
            .filter((n) => {
                if (!search.trim()) return true;
                const q = search.toLowerCase();
                return n.title.toLowerCase().includes(q) || n.bookId?.title?.toLowerCase().includes(q);
            })
            .reduce((acc, note) => {
                const key = note.bookId?._id || "standalone";
                if (!acc[key]) acc[key] = { book: note.bookId || null, notes: [] };
                acc[key].notes.push(note);
                return acc;
            }, {});
    }, [notes, search]);

    return (
        <div className="text-white flex flex-col min-h-full">
            <Navbar
                title="My Notes"
                subtitle={`${notes.length} note${notes.length !== 1 ? "s" : ""} across all books`}
                icon={NotebookPen}
                iconColor="text-purple-400"
                iconBg="bg-purple-500/15"
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full flex-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by title or book..."
                            className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setActiveNote({})}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                        <Plus className="size-4" /> New Note
                    </button>
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="size-8 text-purple-400 animate-spin" />
                    </div>
                )}

                {error && (
                    <p className="text-center text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 max-w-md mx-auto">{error}</p>
                )}

                {!isLoading && !error && notes.length === 0 && (
                    <div className="text-center py-32">
                        <NotebookPen className="size-16 text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-zinc-400 mb-2">No notes yet</h3>
                        <p className="text-zinc-600 text-sm mb-6">
                            Open a book and take notes, or create a standalone note.
                        </p>
                        <button
                            onClick={() => setActiveNote({})}
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
                        >
                            Create Note
                        </button>
                    </div>
                )}

                {!isLoading && !error && notes.length > 0 && Object.keys(grouped).length === 0 && (
                    <div className="text-center py-32">
                        <Search className="size-16 text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-zinc-400 mb-2">No results</h3>
                        <p className="text-zinc-600 text-sm">No notes match your search.</p>
                    </div>
                )}

                {!isLoading && !error && Object.keys(grouped).length > 0 && (
                    <div className="space-y-10">
                        {Object.values(grouped).map(({ book, notes: bookNotes }, gIdx) => (
                            <motion.div
                                key={book?._id || "standalone"}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: gIdx * 0.06 }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    {book?.coverImage ? (
                                        <img src={book.coverImage} alt={book.title} className="w-9 h-11 rounded-lg object-cover border border-zinc-700/50 shadow-sm shrink-0" />
                                    ) : (
                                        <div className={`w-9 h-11 rounded-lg bg-zinc-900 border border-zinc-800/60 flex items-center justify-center shrink-0`}>
                                            {!book ? <NotebookPen className="size-4 text-purple-500/60" /> : <BookOpen className="size-4 text-zinc-600" />}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-sm font-semibold text-white truncate">{book?.title || "Standalone Notes"}</h2>
                                        {book?.author && <p className="text-[11px] text-zinc-500 mt-0.5">{book.author}</p>}
                                        {!book && <p className="text-[11px] text-purple-400/60 mt-0.5">Personal notes</p>}
                                    </div>
                                    {book?._id && (
                                        <Link
                                            to={`/books/${book._id}`}
                                            className="text-[11px] text-zinc-500 hover:text-purple-400 font-medium flex items-center gap-1 transition-colors"
                                        >
                                            Open <ChevronRight className="size-3" />
                                        </Link>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {bookNotes.map((note, nIdx) => (
                                        <NoteCard
                                            key={note._id}
                                            note={note}
                                            onClick={setActiveNote}
                                            index={nIdx}
                                            isStandalone={!book}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {activeNote !== null && (
                    <NoteModal
                        note={activeNote}
                        onClose={() => setActiveNote(null)}
                        onSave={async (data) => {
                            if (activeNote._id) {
                                await editNote(activeNote._id, data);
                            } else {
                                await addNote(data);
                            }
                        }}
                        onDelete={removeNote}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotesPage;
