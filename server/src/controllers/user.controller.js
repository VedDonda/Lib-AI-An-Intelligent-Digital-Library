import { User } from "../models/user.model.js";
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

// ─── Toggle Bookmark ─────────────────────────────────────────────────
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

// ─── Get Bookmarks ───────────────────────────────────────────────────
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

export { getCurrentUser, librarianDashboard, toggleBookmark, getBookmarks };
