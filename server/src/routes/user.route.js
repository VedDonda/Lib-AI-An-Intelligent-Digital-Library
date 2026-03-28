import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  verifyOtp,
  resendOtp,
} from "../controllers/auth.controller.js";
import { getCurrentUser, librarianDashboard, toggleBookmark, getBookmarks } from "../controllers/user.controller.js";
import { sendForgotPasswordOtp, verifyForgotPasswordOtp, resetPassword } from "../controllers/password.controller.js";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.post("/refresh-token", refreshAccessToken);
router.get("/me", verifyJWT, getCurrentUser);
router.get("/librarian", verifyJWT, authorizeRoles("librarian"), librarianDashboard);

router.post("/forgot-password", sendForgotPasswordOtp);
router.post("/forgot-password/verify-otp", verifyForgotPasswordOtp);
router.post("/forgot-password/reset", resetPassword);

router.post("/bookmark/:bookId", verifyJWT, toggleBookmark);
router.get("/bookmarks", verifyJWT, getBookmarks);

export default router;
