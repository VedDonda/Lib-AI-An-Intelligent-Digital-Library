import { Router } from "express";
import {
    getNotesByBook,
    getAllNotes,
    createNote,
    updateNote,
    deleteNote,
} from "../controllers/note.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.get("/all", getAllNotes);
router.get("/", getNotesByBook);
router.post("/", createNote);
router.patch("/:id", updateNote);
router.delete("/:id", deleteNote);

export default router;
