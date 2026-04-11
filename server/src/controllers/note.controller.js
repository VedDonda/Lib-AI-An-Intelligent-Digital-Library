import { Note } from "../models/note.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const getNotesByBook = asyncHandler(async (req, res) => {
    const { bookId } = req.query;

    const filter = { userId: req.user._id };
    if (bookId) filter.bookId = bookId;

    const notes = await Note.find(filter).sort({ updatedAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, notes, "Notes fetched successfully"));
});

const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find({ userId: req.user._id })
        .populate("bookId", "title author coverImage")
        .sort({ updatedAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, notes, "All notes fetched successfully"));
});

const createNote = asyncHandler(async (req, res) => {
    const { bookId, title, content } = req.body;

    if (!title) {
        throw new ApiError(400, "title is required");
    }

    const note = await Note.create({
        userId: req.user._id,
        bookId: bookId || null,
        title: title.trim(),
        content: content || "",
    });

    return res
        .status(201)
        .json(new ApiResponse(201, note, "Note created successfully"));
});

const updateNote = asyncHandler(async (req, res) => {
    const { title, content } = req.body;
    const { id } = req.params;

    const note = await Note.findOne({ _id: id, userId: req.user._id });
    if (!note) {
        throw new ApiError(404, "Note not found");
    }

    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;

    await note.save();

    return res
        .status(200)
        .json(new ApiResponse(200, note, "Note updated successfully"));
});

const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const note = await Note.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!note) {
        throw new ApiError(404, "Note not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Note deleted successfully"));
});

export { getNotesByBook, getAllNotes, createNote, updateNote, deleteNote };
