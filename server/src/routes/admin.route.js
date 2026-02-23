import { Router } from "express";
import {
    getPendingLibrarians,
    approveLibrarian,
    rejectLibrarian,
} from "../controllers/admin.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT, authorizeRoles("admin"));

router.get("/pending-librarians", getPendingLibrarians);
router.post("/approve-librarian/:librarianId", approveLibrarian);
router.delete("/reject-librarian/:librarianId", rejectLibrarian);

export default router;
