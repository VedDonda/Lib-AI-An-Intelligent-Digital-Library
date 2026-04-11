import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        bookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            default: null,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

noteSchema.index({ userId: 1, bookId: 1 });
noteSchema.index({ userId: 1 });

export const Note = mongoose.model("Note", noteSchema);
