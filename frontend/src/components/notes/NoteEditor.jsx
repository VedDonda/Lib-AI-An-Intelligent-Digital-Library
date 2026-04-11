import { useRef, useEffect } from "react";
import {
    Bold,
    Italic,
    Underline,
    Highlighter,
    List,
    ListOrdered,
    Heading2,
    Heading3,
} from "lucide-react";

export const ToolBtn = ({ icon: Icon, title, onMouseDown }) => (
    <button
        type="button"
        title={title}
        onMouseDown={onMouseDown}
        className="p-1.5 rounded-lg transition-all cursor-pointer text-zinc-500 hover:bg-zinc-800 hover:text-purple-300 active:scale-95"
    >
        <Icon className="size-3.5" />
    </button>
);

export const RichToolbar = ({ editorRef }) => {
    const exec = (cmd, val = null) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, val);
    };

    return (
        <div className="flex flex-wrap items-center gap-0.5 px-4 py-2 border-b border-zinc-800/50 shrink-0 bg-zinc-900/30">
            <ToolBtn icon={Bold} title="Bold" onMouseDown={(e) => { e.preventDefault(); exec("bold"); }} />
            <ToolBtn icon={Italic} title="Italic" onMouseDown={(e) => { e.preventDefault(); exec("italic"); }} />
            <ToolBtn icon={Underline} title="Underline" onMouseDown={(e) => { e.preventDefault(); exec("underline"); }} />
            <span className="w-px h-4 bg-zinc-800/60 mx-1 inline-block" />
            <ToolBtn icon={Highlighter} title="Highlight" onMouseDown={(e) => { e.preventDefault(); exec("hiliteColor", "#7c3aed30"); }} />
            <span className="w-px h-4 bg-zinc-800/60 mx-1 inline-block" />
            <ToolBtn icon={Heading2} title="Heading" onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "H2"); }} />
            <ToolBtn icon={Heading3} title="Sub-heading" onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "H3"); }} />
            <span className="w-px h-4 bg-zinc-800/60 mx-1 inline-block" />
            <ToolBtn icon={List} title="Bullet list" onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }} />
            <ToolBtn icon={ListOrdered} title="Numbered list" onMouseDown={(e) => { e.preventDefault(); exec("insertOrderedList"); }} />
        </div>
    );
};

export const NoteEditorStyles = `
    .notes-editor-page:empty:before { content: attr(data-placeholder); color: #3f3f46; pointer-events: none; display: block; }
    .notes-editor-page h2 { font-size: 1rem; font-weight: 700; margin: 0.75rem 0 0.25rem; color: #e4e4e7; }
    .notes-editor-page h3 { font-size: 0.875rem; font-weight: 600; margin: 0.5rem 0 0.25rem; color: #d4d4d8; }
    .notes-editor-page ul { list-style: disc; padding-left: 1.25rem; margin: 0.25rem 0; }
    .notes-editor-page ol { list-style: decimal; padding-left: 1.25rem; margin: 0.25rem 0; }
    .notes-editor-page b, .notes-editor-page strong { color: #c4b5fd; }
    .notes-editor-page i, .notes-editor-page em { color: #a78bfa; font-style: italic; }
    .notes-editor-page u { text-decoration-color: #7c3aed; }
    .notes-editor-page p { margin-bottom: 0.4rem; }
`;

const NoteEditor = ({ title, setTitle, content, onInput, editorRef, className = "", isReadOnly = false }) => {
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== content) {
            editorRef.current.innerHTML = content || "";
        }
    }, [content, isReadOnly]);

    return (
        <div className={`flex flex-col h-full bg-[#0a0a0a] rounded-2xl overflow-hidden ${className}`}>
            {!isReadOnly && (
                <div className="px-6 pt-4 pb-2 shrink-0 border-b border-zinc-800/50">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            onInput && onInput();
                        }}
                        placeholder="Note title..."
                        autoFocus
                        className="w-full bg-transparent border-none px-0 py-1 text-base font-bold text-white placeholder-zinc-600 focus:outline-none focus:ring-0 transition-all"
                    />
                </div>
            )}

            {isReadOnly && title && (
                <div className="px-6 pt-5 pb-3 shrink-0 border-b border-zinc-800/30">
                    <h2 className="text-lg font-bold text-white">{title}</h2>
                </div>
            )}

            {!isReadOnly && <RichToolbar editorRef={editorRef} />}

            <div
                ref={editorRef}
                contentEditable={!isReadOnly}
                suppressContentEditableWarning={!isReadOnly}
                onInput={() => !isReadOnly && onInput && onInput()}
                data-placeholder={isReadOnly ? "" : "Start writing your note..."}
                className={`flex-1 overflow-y-auto px-6 ${isReadOnly ? 'py-4' : 'py-5'} text-sm text-zinc-300 leading-relaxed focus:outline-none [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full notes-editor-page min-h-[160px]`}
            />
            <style>{NoteEditorStyles}</style>
        </div>
    );
};

export default NoteEditor;
