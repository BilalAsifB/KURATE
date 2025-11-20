import { Router } from "express";
import {
    uploadDocument,
    submitDocumentURL,
    getAllDocuments,
    getDocumentById,
    deleteDocument,
} from "../controllers/document.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/upload.middlewares.js";

const router = Router();

// All routes are protected and require JWT verification
router.use(verifyJWT);

// GET all documents from authenticated user
router.route("/").get(getAllDocuments);

// GET a specific document by ID
router.route("/:id").get(getDocumentById);

// POST file upload
router.route("/upload").post(upload.single("file"), uploadDocument);

// POST URL submission
router.route("/url").post(submitDocumentURL);

// DELETE a specific document by ID
router.route("/:id").delete(deleteDocument);

export default router;