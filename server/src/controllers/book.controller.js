import { Book } from "../models/book.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, getSignedUrl } from "../utils/cloudinary.js";

// ─── Get all books (public) ─────────────────────────────────────────
const getAllBooks = asyncHandler(async (req, res) => {
    const books = await Book.find()
        .select("-__v")
        .sort({ createdAt: -1 })
        .populate("uploadedBy", "name");

    return res
        .status(200)
        .json(new ApiResponse(200, books, "Books fetched successfully"));
});

// ─── Get single book (public) ───────────────────────────────────────
const getBookById = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id)
        .populate("uploadedBy", "name");

    if (!book) {
        throw new ApiError(404, "Book not found");
    }

    // Generate a signed URL for the PDF so it bypasses Cloudinary 401
    const bookData = book.toObject();
    if (bookData.pdfPublicId) {
        bookData.pdfUrl = getSignedUrl(bookData.pdfPublicId, "raw");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, bookData, "Book fetched successfully"));
});

// ─── Upload book (librarian only) ───────────────────────────────────
const addBook = asyncHandler(async (req, res) => {
    const { title, author, description } = req.body;

    if (!title || !author) {
        throw new ApiError(400, "title and author are required");
    }

    if (!req.files?.pdfFile?.[0]) {
        throw new ApiError(400, "PDF file is required");
    }

    // Upload PDF to Cloudinary as "raw"
    const pdfUpload = await uploadOnCloudinary(
        req.files.pdfFile[0].path,
        "raw"
    );
    if (!pdfUpload) {
        throw new ApiError(500, "Failed to upload PDF to cloud storage");
    }

    // Upload cover image to Cloudinary (optional)
    let coverImageUrl = "";
    if (req.files?.coverImage?.[0]) {
        const coverUpload = await uploadOnCloudinary(
            req.files.coverImage[0].path,
            "image"
        );
        if (coverUpload) {
            coverImageUrl = coverUpload.secure_url;
        }
    }

    const book = await Book.create({
        title: title.trim(),
        author: author.trim(),
        description: description?.trim() || "",
        coverImage: coverImageUrl,
        pdfUrl: pdfUpload.secure_url,
        pdfPublicId: pdfUpload.public_id,
        uploadedBy: req.user._id,
    });

    const populatedBook = await Book.findById(book._id).populate("uploadedBy", "name");

    return res
        .status(201)
        .json(new ApiResponse(201, populatedBook, "Book uploaded successfully"));
});

// ─── Delete book (librarian only) ───────────────────────────────────
const deleteBook = asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);

    if (!book) {
        throw new ApiError(404, "Book not found");
    }

    await Book.findByIdAndDelete(req.params.id);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Book deleted successfully"));
});

export { getAllBooks, getBookById, addBook, deleteBook };
