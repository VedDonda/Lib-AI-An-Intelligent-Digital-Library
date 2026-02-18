import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
};

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "name, email and password are required");
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existedUser = await User.findOne({ email: normalizedEmail });
    if (existedUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: role || "student",
    });

    const createdUser = await User.findById(user._id).select("-password");

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "email and password are required");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new ApiError(500, "ACCESS_TOKEN_SECRET is not configured");
    }

    const accessToken = user.generateAccessToken();
    const loggedInUser = await User.findById(user._id).select("-password");

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .json(
        new ApiResponse(
            200,
            {
            user: loggedInUser,
            accessToken,
            },
            "User logged in successfully"
        )
    );
});

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

export { registerUser, loginUser, getCurrentUser, librarianDashboard };
