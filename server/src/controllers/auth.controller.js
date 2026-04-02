import { User } from "../models/user.model.js";
import { Otp } from "../models/otp.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateOtp } from "../utils/generateOtp.js";
import { sendEmail } from "../utils/sendEmail.js";
import jwt from "jsonwebtoken";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

//Beautiful OTP email template
const buildOtpEmailHtml = (name, otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#050505;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050505;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;border:1px solid #27272a;border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 0;text-align:center;">
              <div style="display:inline-block;background:rgba(168,85,247,0.15);padding:12px;border-radius:12px;margin-bottom:16px;">
                <span style="font-size:28px;">📚</span>
              </div>
              <h1 style="color:#ffffff;font-size:22px;margin:8px 0 4px;">LibAI</h1>
              <p style="color:#a1a1aa;font-size:13px;margin:0;">Intelligent Digital Library</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#ffffff;font-size:18px;margin:0 0 8px;">Hi ${name},</h2>
              <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Use the verification code below to complete your registration. This code expires in <strong style="color:#c084fc;">10 minutes</strong>.
              </p>
              <!-- OTP Box -->
              <div style="background:linear-gradient(135deg,rgba(168,85,247,0.1),rgba(99,102,241,0.1));border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#c084fc;font-family:'Courier New',monospace;">${otp}</span>
              </div>
              <p style="color:#71717a;font-size:12px;line-height:1.5;margin:0;">
                If you didn't create an account with LibAI, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 24px;text-align:center;border-top:1px solid #27272a;">
              <p style="color:#52525b;font-size:11px;margin:16px 0 0;">© ${new Date().getFullYear()} LibAI · Intelligent Digital Library</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

//Register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "name, email and password are required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // If a verified user already exists, reject
  const existedUser = await User.findOne({ email: normalizedEmail });
  if (existedUser) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  // Clear any previous pending OTP for this email, then create a fresh one
  // Store name, password, role in the OTP doc — NO User is created yet
  await Otp.deleteMany({ email: normalizedEmail, purpose: "verify" });
  const otp = generateOtp();
  await Otp.create({
    email: normalizedEmail,
    otp,
    purpose: "verify",
    pendingName: name.trim(),
    pendingPassword: password,
    pendingRole: role || "student",
  });

  await sendEmail({
    to: normalizedEmail,
    subject: "Verify your LibAI account",
    html: buildOtpEmailHtml(name.trim(), otp),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { email: normalizedEmail }, "OTP sent. Please verify to complete registration."));
});

//Verify OTP
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "email and otp are required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const otpRecord = await Otp.findOne({ email: normalizedEmail, otp, purpose: "verify" });
  if (!otpRecord) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  // OTP matched — now create the User in MongoDB for the first time
  const user = await User.create({
    name: otpRecord.pendingName,
    email: normalizedEmail,
    password: otpRecord.pendingPassword,
    role: otpRecord.pendingRole || "student",
    isVerified: true,
  });

  // Delete used OTP
  await Otp.deleteMany({ email: normalizedEmail, purpose: "verify" });

  const createdUser = await User.findById(user._id).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "Email verified. Account created successfully!"));
});

//Resend OTP
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "email is required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Look up the pending OTP (no User needed)
  const pendingOtp = await Otp.findOne({ email: normalizedEmail, purpose: "verify" });
  if (!pendingOtp) {
    throw new ApiError(404, "No pending registration found. Please sign up again.");
  }

  // Rate limit: 60 seconds between resends
  const secondsSinceCreated = (Date.now() - pendingOtp.createdAt.getTime()) / 1000;
  if (secondsSinceCreated < 60) {
    throw new ApiError(429, `Please wait ${Math.ceil(60 - secondsSinceCreated)} seconds before requesting a new OTP.`);
  }

  // Generate a new OTP, keep all pending data
  const otp = generateOtp();
  pendingOtp.otp = otp;
  pendingOtp.createdAt = new Date();
  await pendingOtp.save();

  await sendEmail({
    to: normalizedEmail,
    subject: "Verify your LibAI account",
    html: buildOtpEmailHtml(pendingOtp.pendingName, otp),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { email: normalizedEmail }, "OTP resent successfully"));
});

//Login
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

  if (user.role === "librarian" && !user.isApproved) {
    throw new ApiError(403, "Your librarian account is pending approval from an administrator.");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Save refresh token in DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const loggedInUser = await User.findById(user._id).select("-password");

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
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

//Logout
const logoutUser = asyncHandler(async (req, res) => {
  // Clear refresh token from DB
  await User.findByIdAndUpdate(req.user._id, { refreshToken: "" });

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

//Refresh Access Token 

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token not found");
  }

  // Verify the refresh token
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (_) {
    throw new ApiError(401, "Refresh token is expired or invalid");
  }

  // Check if it matches the one stored in DB
  const user = await User.findById(decoded._id).select("+refreshToken");
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is expired or invalid");
  }

  // Generate new access token only
  const accessToken = user.generateAccessToken();

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});

export { registerUser, verifyOtp, resendOtp, loginUser, logoutUser, refreshAccessToken };

