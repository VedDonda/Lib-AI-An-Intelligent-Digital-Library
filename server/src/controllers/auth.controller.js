import { User } from "../models/user.model.js";
import { Otp } from "../models/otp.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateOtp } from "../utils/generateOtp.js";
import { sendEmail } from "../utils/sendEmail.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

// ─── Beautiful OTP email template ───────────────────────────────────
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

// ─── Register ───────────────────────────────────────────────────────
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "name, email and password are required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existedUser = await User.findOne({ email: normalizedEmail });
  if (existedUser) {
    if (existedUser.isVerified) {
      throw new ApiError(409, "User with this email already exists");
    }
    // Unverified user exists — delete and allow re-registration
    await User.deleteOne({ _id: existedUser._id });
  }

  // Create user (unverified)
  await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: role || "student",
  });

  // Generate OTP, remove any old OTPs for this email
  await Otp.deleteMany({ email: normalizedEmail });
  const otp = generateOtp();
  await Otp.create({ email: normalizedEmail, otp });

  // Send verification email
  await sendEmail({
    to: normalizedEmail,
    subject: "Verify your LibAI account",
    html: buildOtpEmailHtml(name.trim(), otp),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { email: normalizedEmail }, "OTP sent to your email. Please verify to complete registration."));
});

// ─── Verify OTP ─────────────────────────────────────────────────────
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "email and otp are required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const otpRecord = await Otp.findOne({ email: normalizedEmail, otp });
  if (!otpRecord) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  // Mark user as verified
  const user = await User.findOneAndUpdate(
    { email: normalizedEmail },
    { isVerified: true },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Clean up used OTP
  await Otp.deleteMany({ email: normalizedEmail });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Email verified successfully"));
});

// ─── Resend OTP ─────────────────────────────────────────────────────
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "email is required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  // Rate limit: check if an OTP was sent less than 60 seconds ago
  const recentOtp = await Otp.findOne({ email: normalizedEmail });
  if (recentOtp) {
    const secondsSinceCreated = (Date.now() - recentOtp.createdAt.getTime()) / 1000;
    if (secondsSinceCreated < 60) {
      throw new ApiError(429, `Please wait ${Math.ceil(60 - secondsSinceCreated)} seconds before requesting a new OTP`);
    }
  }

  // Generate new OTP
  await Otp.deleteMany({ email: normalizedEmail });
  const otp = generateOtp();
  await Otp.create({ email: normalizedEmail, otp });

  await sendEmail({
    to: normalizedEmail,
    subject: "Verify your LibAI account",
    html: buildOtpEmailHtml(user.name, otp),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { email: normalizedEmail }, "OTP resent successfully"));
});

// ─── Login ──────────────────────────────────────────────────────────
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

// ─── Logout ─────────────────────────────────────────────────────────
const logoutUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// ─── Other handlers ─────────────────────────────────────────────────
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

// ─── Forgot Password OTP email template ─────────────────────────────
const buildForgotPasswordEmailHtml = (name, otp) => `
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
          <tr>
            <td style="padding:32px 32px 0;text-align:center;">
              <div style="display:inline-block;background:rgba(239,68,68,0.15);padding:12px;border-radius:12px;margin-bottom:16px;">
                <span style="font-size:28px;">🔐</span>
              </div>
              <h1 style="color:#ffffff;font-size:22px;margin:8px 0 4px;">LibAI</h1>
              <p style="color:#a1a1aa;font-size:13px;margin:0;">Intelligent Digital Library</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#ffffff;font-size:18px;margin:0 0 8px;">Hi ${name},</h2>
              <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">
                We received a request to reset your password. Use the code below. It expires in <strong style="color:#f87171;">10 minutes</strong>.
              </p>
              <div style="background:linear-gradient(135deg,rgba(239,68,68,0.1),rgba(249,115,22,0.1));border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#f87171;font-family:'Courier New',monospace;">${otp}</span>
              </div>
              <p style="color:#71717a;font-size:12px;line-height:1.5;margin:0;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
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

// ─── Forgot Password — Send OTP ──────────────────────────────────────
const sendForgotPasswordOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "email is required");

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) throw new ApiError(404, "No account found with this email");
  if (!user.isVerified) throw new ApiError(400, "Please verify your account first");

  // Rate limit: 60 seconds
  const recentOtp = await Otp.findOne({ email: normalizedEmail, purpose: "reset" });
  if (recentOtp) {
    const secsSince = (Date.now() - recentOtp.createdAt.getTime()) / 1000;
    if (secsSince < 60)
      throw new ApiError(429, `Please wait ${Math.ceil(60 - secsSince)} seconds before retrying`);
  }

  await Otp.deleteMany({ email: normalizedEmail, purpose: "reset" });
  const otp = generateOtp();
  await Otp.create({ email: normalizedEmail, otp, purpose: "reset" });

  await sendEmail({
    to: normalizedEmail,
    subject: "Reset your LibAI password",
    html: buildForgotPasswordEmailHtml(user.name, otp),
  });

  return res.status(200).json(new ApiResponse(200, { email: normalizedEmail }, "OTP sent to your email"));
});

// ─── Forgot Password — Verify OTP ────────────────────────────────────
const verifyForgotPasswordOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, "email and otp are required");

  const normalizedEmail = email.toLowerCase().trim();
  const otpRecord = await Otp.findOne({ email: normalizedEmail, otp, purpose: "reset" });
  if (!otpRecord) throw new ApiError(400, "Invalid or expired OTP");

  // Issue a short-lived reset token stored in OTP doc
  const resetToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
  otpRecord.resetToken = resetToken;
  await otpRecord.save();

  return res.status(200).json(new ApiResponse(200, { resetToken }, "OTP verified. You may now reset your password."));
});

// ─── Forgot Password — Reset Password ────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const { email, resetToken, newPassword } = req.body;
  if (!email || !resetToken || !newPassword)
    throw new ApiError(400, "email, resetToken and newPassword are required");
  if (newPassword.length < 6)
    throw new ApiError(400, "Password must be at least 6 characters");

  const normalizedEmail = email.toLowerCase().trim();
  const otpRecord = await Otp.findOne({ email: normalizedEmail, resetToken, purpose: "reset" });
  if (!otpRecord) throw new ApiError(400, "Invalid or expired reset token");

  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  user.password = newPassword;
  await user.save();

  await Otp.deleteMany({ email: normalizedEmail, purpose: "reset" });

  return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully"));
});

export { registerUser, verifyOtp, resendOtp, loginUser, logoutUser, getCurrentUser, librarianDashboard, sendForgotPasswordOtp, verifyForgotPasswordOtp, resetPassword };

