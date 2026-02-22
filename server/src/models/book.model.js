import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        author: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        coverImage: {
            type: String, // Cloudinary URL
            default: "",
        },
        pdfUrl: {
            type: String, // Cloudinary URL (raw)
            required: true,
        },
        pdfPublicId: {
            type: String, // Cloudinary public_id for signed URL generation
            default: "",
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

export const Book = mongoose.model("Book", bookSchema);
