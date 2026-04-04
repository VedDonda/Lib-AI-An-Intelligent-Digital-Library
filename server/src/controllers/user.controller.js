import { User } from "../models/user.model.js";
import { Book } from "../models/book.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const librarianDashboard = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Welcome librarian"));
});

const toggleBookmark = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const isBookmarked = user.bookmarks.some((id) => id.toString() === bookId);

  if (isBookmarked) {
    user.bookmarks = user.bookmarks.filter((id) => id.toString() !== bookId);
  } else {
    user.bookmarks.push(bookId);
  }

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, { bookmarked: !isBookmarked, bookmarks: user.bookmarks }, isBookmarked ? "Bookmark removed" : "Book bookmarked")
  );
});

const getBookmarks = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "bookmarks",
    select: "title author coverImage description createdAt",
    populate: { path: "uploadedBy", select: "name" },
  });

  if (!user) throw new ApiError(404, "User not found");

  return res.status(200).json(
    new ApiResponse(200, user.bookmarks, "Bookmarks fetched successfully")
  );
});

const addToHistory = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  user.readHistory = user.readHistory.filter((item) => item.book.toString() !== bookId);
  user.readHistory.unshift({ book: bookId, viewedAt: Date.now() });

  if (user.readHistory.length > 10) {
    user.readHistory = user.readHistory.slice(0, 10);
  }

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, user.readHistory, "Added to reading history"));
});

const getReadHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "readHistory.book",
    select: "title author coverImage",
  });
  if (!user) throw new ApiError(404, "User not found");

  const history = user.readHistory
    .filter((item) => item.book)
    .map((item) => ({
      ...item.book.toObject(),
      viewedAt: item.viewedAt,
    }));

  return res.status(200).json(new ApiResponse(200, history, "Read history fetched"));
});

const getUserUploads = asyncHandler(async (req, res) => {
  const books = await Book.find({ uploadedBy: req.user._id })
    .select("title author coverImage createdAt")
    .sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, books, "Uploads fetched"));
});

export { getCurrentUser, librarianDashboard, toggleBookmark, getBookmarks, addToHistory, getReadHistory, getUserUploads };
