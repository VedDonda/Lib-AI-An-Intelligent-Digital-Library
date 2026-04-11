import { useState, useCallback, useEffect } from "react";
import { getNotes, getAllNotes, createNote, updateNote, deleteNote as deleteNoteApi } from "../lib/bookApi";
import { useAuth } from "../context/AuthContext";

export const useNotes = (bookId = null, fetchAll = false) => {
    const { token } = useAuth();
    const [notes, setNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchNotes = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError("");
        try {
            let res;
            if (fetchAll) {
                res = await getAllNotes(token);
            } else if (bookId) {
                res = await getNotes(bookId, token);
            } else if (bookId === undefined) {
                 res = await getNotes(undefined, token);
            } else {
                res = await getAllNotes(token);
            }
            setNotes(res.data || []);
        } catch (err) {
            setError(err.message || "Failed to load notes");
        } finally {
            setIsLoading(false);
        }
    }, [bookId, token]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const addNote = async (data) => {
        try {
            const payload = { ...data };
            if (payload.bookId === undefined && bookId) {
                payload.bookId = bookId;
            }
            if (payload.bookId === null) {
                delete payload.bookId;
            }
            const res = await createNote(payload, token);
            setNotes((prev) => [res.data, ...prev]);
            return res.data;
        } catch (err) {
            throw err;
        }
    };

    const editNote = async (id, data) => {
        try {
            const res = await updateNote(id, data, token);
            setNotes((prev) => prev.map((n) => (n._id === id ? res.data : n)));
            return res.data;
        } catch (err) {
            throw err;
        }
    };

    const removeNote = async (id) => {
        try {
            await deleteNoteApi(id, token);
            setNotes((prev) => prev.filter((n) => n._id !== id));
        } catch (err) {
            throw err;
        }
    };

    return {
        notes,
        isLoading,
        error,
        fetchNotes,
        addNote,
        editNote,
        removeNote,
    };
};
