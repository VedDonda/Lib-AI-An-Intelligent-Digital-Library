import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Save, NotebookPen, ChevronLeft, ChevronDown, Loader2, AlertCircle, Edit3 } from "lucide-react";
import { useNotes } from "../hooks/useNotes";
import NoteCard from "./notes/NoteCard";
import NoteEditor from "./notes/NoteEditor";

const CustomDropdown = ({ options, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedItem = options.find(o => o.value === value) || options[0];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-700/60 hover:border-indigo-500/40 hover:bg-zinc-800/60 text-xs text-zinc-300 font-bold rounded-xl px-4 py-2 transition-all cursor-pointer shadow-lg min-w-[120px]"
            >
                {selectedItem.label}
                <ChevronDown className={`size-3.5 text-zinc-500 transition-transform ${isOpen ? "rotate-180 text-purple-400" : ""}`} />
            </button>
            
            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 w-full min-w-[120px] bg-[#0a0a0a] border border-zinc-800 rounded-xl shadow-xl shadow-black/50 overflow-hidden z-[70] p-1.5"
                        >
                            {options.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                                        value === opt.value
                                            ? "bg-purple-500/15 text-purple-300 font-bold"
                                            : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

const BookNotesComponent = ({ bookId, book, onClose }) => {
    const { notes: allNotes, isLoading, error: hookError, addNote, editNote, removeNote } = useNotes(bookId, true);
    
    const [filterType, setFilterType] = useState("all");
    const [isStandaloneNew, setIsStandaloneNew] = useState(false);

    const notes = useMemo(() => {
        let filtered = allNotes.filter(note => !note.bookId || note.bookId?._id === bookId || note.bookId === bookId);
        if (filterType === "standalone") return filtered.filter(n => !n.bookId);
        if (filterType === "book") return filtered.filter(n => n.bookId);
        return filtered;
    }, [allNotes, bookId, filterType]);

    const [view, setView] = useState("list");
    const [activeNote, setActiveNote] = useState(null);
    const [titleInput, setTitleInput] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const editorRef = useRef(null);

    const handleOpenNote = (note = null) => {
        setActiveNote(note || {});
        setTitleInput(note?.title || "");
        setError("");
        setIsStandaloneNew(false);
        setView(note?._id ? "read" : "editor");
    };

    const handleSave = async () => {
        if (!titleInput.trim()) { setError("Title is required"); return; }
        setIsSaving(true);
        setError("");

        try {
            const content = editorRef.current?.innerHTML || "";
            if (activeNote._id) {
                await editNote(activeNote._id, { title: titleInput.trim(), content });
            } else {
                await addNote({ title: titleInput.trim(), content, bookId: isStandaloneNew ? null : bookId });
            }
            setView("list");
            setActiveNote(null);
        } catch (err) {
            setError(err.message || "Failed to save note");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!activeNote?._id) return;
        setIsSaving(true);
        try {
            await removeNote(activeNote._id);
            setView("list");
            setActiveNote(null);
        } catch (err) {
            setError(err.message || "Failed to delete note");
        } finally {
            setIsSaving(false);
        }
    };

    const displayError = error || hookError;

    return (
        <div className="flex flex-col h-full bg-[#050505] text-white border-l border-zinc-800/50">
            <div className="flex items-center justify-between px-5 h-16 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-800/50 z-10 sticky top-0 shrink-0">
                <div className="flex items-center gap-3">
                    {(view === "editor" || view === "read") && (
                        <button
                            onClick={() => { setView("list"); setActiveNote(null); }}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                    )}
                    <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30">
                        <NotebookPen className="size-4 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            {view === "editor" ? (activeNote?._id ? "Edit Note" : "New Note") : (view === "read" ? "View Note" : "Notes")}
                        </h2>
                        <p className="text-[11px] text-purple-400 font-medium tracking-wide mt-0.5 truncate max-w-[120px]">
                            {view === "list" ? `${notes.length} note${notes.length !== 1 ? "s" : ""}` : book?.title}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {view === "list" && (
                        <>
                            <CustomDropdown
                                value={filterType}
                                onChange={setFilterType}
                                options={[
                                    { value: "all", label: "All Notes" },
                                    { value: "book", label: "This Book" },
                                    { value: "standalone", label: "Standalone" }
                                ]}
                            />
                            <button
                                onClick={() => handleOpenNote(null)}
                                className="flex items-center gap-2 px-4 py-2 ml-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95 border border-purple-500/30 cursor-pointer shrink-0"
                            >
                                <Plus className="size-3.5" /> New
                            </button>
                        </>
                    )}
                    {view === "read" && activeNote?._id && (
                        <>
                            <button
                                onClick={handleDelete}
                                disabled={isSaving}
                                className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
                            >
                                <Trash2 className="size-4" />
                            </button>
                            <button
                                onClick={() => setView("editor")}
                                className="flex items-center gap-2 px-4 py-2 ml-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95 border border-purple-500/30 cursor-pointer"
                            >
                                <Edit3 className="size-3.5" /> Edit
                            </button>
                        </>
                    )}
                    {view === "editor" && (
                        <>
                            {!activeNote?._id && (
                                <CustomDropdown
                                    value={isStandaloneNew}
                                    onChange={setIsStandaloneNew}
                                    options={[
                                        { value: false, label: "For this book" },
                                        { value: true, label: "Standalone note" }
                                    ]}
                                />
                            )}

                            <button
                                onClick={handleSave}
                                disabled={isSaving || !titleInput.trim()}
                                className="flex items-center gap-2 px-4 py-2 ml-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-purple-900/20 transition-all hover:scale-105 active:scale-95 border border-purple-500/30 cursor-pointer disabled:opacity-40"
                            >
                                {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save
                            </button>
                        </>
                    )}
                    {onClose && (
                        <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer shadow-none">
                            <X className="size-4" />
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {displayError && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden shrink-0 px-4 pt-3">
                        <div className="flex items-center gap-2 px-4 py-2.5 text-[11px] bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                            <AlertCircle className="size-3.5 shrink-0" />
                            {displayError}
                            <button onClick={() => setError("")} className="ml-auto cursor-pointer"><X className="size-3" /></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {view === "list" && (
                    <motion.div key="list" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {isLoading ? (
                            <div className="flex justify-center h-full items-center"><Loader2 className="size-6 text-purple-400 animate-spin" /></div>
                        ) : notes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                                <NotebookPen className="size-8 text-zinc-700 mb-3" />
                                <p className="text-sm font-semibold text-zinc-400">No notes yet</p>
                                <p className="text-[11px] text-zinc-600 mt-1">Jot down your thoughts while reading.</p>
                            </div>
                        ) : (
                            notes.map((note, idx) => (
                                <NoteCard key={note._id} note={note} onClick={handleOpenNote} index={idx} isStandalone={!note.bookId} />
                            ))
                        )}
                    </motion.div>
                )}

                {(view === "editor" || view === "read") && (
                    <motion.div key="editor" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex-1 flex flex-col p-4 overflow-hidden">
                        <NoteEditor
                            title={titleInput}
                            setTitle={setTitleInput}
                            content={activeNote?.content || ""}
                            editorRef={editorRef}
                            className="flex-1 border border-zinc-800/60"
                            isReadOnly={view === "read"}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BookNotesComponent;
