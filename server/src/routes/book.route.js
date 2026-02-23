import { Router } from "express";
import {
    getAllBooks,
    getBookById,
    addBook,
    deleteBook,
} from "../controllers/book.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.get("/", getAllBooks);
router.get("/:id", getBookById);

router.post(
    "/",
    verifyJWT,
    authorizeRoles("librarian", "admin"),
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "pdfFile", maxCount: 1 },
    ]),
    addBook
);

router.delete(
    "/:id",
    verifyJWT,
    authorizeRoles("librarian", "admin"),
    deleteBook
);

export default router;
