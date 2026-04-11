import { motion } from "framer-motion";
import { FileText, BookOpen, Clock } from "lucide-react";

export const timeAgo = (d) => {
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

const NoteCard = ({ note, onClick, index = 0, isStandalone = false }) => {
    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            onClick={() => onClick(note)}
            className="w-full text-left group block bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-900/10 transition-all duration-300 cursor-pointer"
        >
            <div className="p-4">
                <div className="flex items-start gap-3 mb-2">
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isStandalone ? "bg-purple-500/15" : "bg-purple-500/15"}`}>
                        <FileText className="size-3.5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">
                            {note.title}
                        </p>
                        {note.bookId?.title && (
                            <div className="flex items-center gap-1 mt-1">
                                <BookOpen className="size-3 text-zinc-600" />
                                <span className="text-[11px] text-zinc-500 truncate">{note.bookId.title}</span>
                            </div>
                        )}
                        {isStandalone && (
                            <span className="text-[11px] text-purple-400/60 font-medium mt-1 block">Standalone</span>
                        )}
                    </div>
                </div>

                {note.content && (
                    <p
                        className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed mt-2 pl-9"
                        dangerouslySetInnerHTML={{
                            __html: note.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
                        }}
                    />
                )}

                <div className="flex items-center gap-1.5 mt-3 pl-9">
                    <Clock className="size-3 text-zinc-700" />
                    <span className="text-[10px] text-zinc-600 font-medium">{timeAgo(note.updatedAt)}</span>
                </div>
            </div>
        </motion.button>
    );
};

export default NoteCard;
