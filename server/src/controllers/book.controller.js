import { Book } from "../models/book.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

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

    return res
        .status(200)
        .json(new ApiResponse(200, book, "Book fetched successfully"));
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

    if (req.user.role !== "admin" && book.uploadedBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this book");
    }

    // Delete PDF from Cloudinary (resource_type: "raw" for PDFs)
    if (book.pdfUrl) {
        await deleteFromCloudinary(book.pdfUrl, "raw");
    }

    // Delete cover image from Cloudinary (resource_type: "image")
    if (book.coverImage) {
        await deleteFromCloudinary(book.coverImage, "image");
    }

    await Book.findByIdAndDelete(req.params.id);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Book deleted successfully"));
});

const updateBook = asyncHandler(async (req, res) => {
    const { title, author, description } = req.body;
    const bookId = req.params.id;

    const book = await Book.findById(bookId);

    if (!book) {
        throw new ApiError(404, "Book not found");
    }

    if (req.user.role !== "admin" && book.uploadedBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to edit this book");
    }

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (author) updateData.author = author.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (req.files?.coverImage?.[0]) {
        if (book.coverImage) {
            await deleteFromCloudinary(book.coverImage, "image");
        }

        const coverUpload = await uploadOnCloudinary(
            req.files.coverImage[0].path,
            "image"
        );
        if (coverUpload) {
            updateData.coverImage = coverUpload.secure_url;
        }
    }

    const updatedBook = await Book.findByIdAndUpdate(
        bookId,
        { $set: updateData },
        { new: true }
    ).populate("uploadedBy", "name");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedBook, "Book updated successfully"));
});

export { getAllBooks, getBookById, addBook, deleteBook, updateBook };
