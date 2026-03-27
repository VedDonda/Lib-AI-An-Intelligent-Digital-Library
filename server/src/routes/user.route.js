import { Router } from "express";
import {
  getCurrentUser,
  librarianDashboard,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  verifyOtp,
  resendOtp,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
} from "../controllers/auth.controller.js";
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

export default router;
