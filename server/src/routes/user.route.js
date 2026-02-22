import { Router } from "express";
import {
  getCurrentUser,
  librarianDashboard,
  loginUser,
  registerUser,
  verifyOtp,
  resendOtp,
} from "../controllers/auth.controller.js";
import { authorizeRoles, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", loginUser);
router.get("/me", verifyJWT, getCurrentUser);
router.get("/librarian", verifyJWT, authorizeRoles("librarian"), librarianDashboard);

export default router;
