import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getPendingLibrarians = asyncHandler(async (req, res) => {
    const pendingLibrarians = await User.find({ role: "librarian", isApproved: false }).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, pendingLibrarians, "Pending librarians fetched successfully"));
});

const approveLibrarian = asyncHandler(async (req, res) => {
    const { librarianId } = req.params;

    if (!librarianId) {
        throw new ApiError(400, "librarianId is required");
    }

    const librarian = await User.findOneAndUpdate(
        { _id: librarianId, role: "librarian" },
        { isApproved: true },
        { new: true }
    ).select("-password");

    if (!librarian) {
        throw new ApiError(404, "Librarian not found or already approved");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, librarian, "Librarian approved successfully"));
});

const rejectLibrarian = asyncHandler(async (req, res) => {
    const { librarianId } = req.params;

    if (!librarianId) {
        throw new ApiError(400, "librarianId is required");
    }

    const deletedLibrarian = await User.findOneAndDelete({ _id: librarianId, role: "librarian", isApproved: false });

    if (!deletedLibrarian) {
        throw new ApiError(404, "Librarian not found or already processed");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Librarian request rejected and account removed"));
});

export { getPendingLibrarians, approveLibrarian, rejectLibrarian };
