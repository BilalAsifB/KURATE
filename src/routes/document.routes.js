import { Router } from "express";
import {
    uploadDocument,
    submitDocumentUrl,
    getAllDocuments,
    getDocumentById,
    deleteDocument,
} from "../controllers/document.controller.js";
import { veryifyJWT } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/upload.middlewares.js";

const router = Router();

// All routes are protected and require JWT verification
router.use(veryifyJWT);

// GET all documents from authenticated user
router.route("/").get(getAllDocuments);

// GET a specific document by ID
router.route("/:id").get(getDocumentById);

// POST file upload
router.route("/upload").post(upload.single("file"), uploadDocument);

// POST URL submission
router.route("/url").post(submitDocumentUrl);

// DELETE a specific document by ID
router.route("/:id").delete(deleteDocument);

export default router;