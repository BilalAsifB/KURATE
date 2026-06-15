import { Router } from "express";
import multer from "multer";
import {
  uploadDocument,
  listAllDocuments,
  getDocument,
  removeDocument,
} from "../controllers/documentController.js";
import {
  savePromptVersion,
  listAllPrompts,
  listVersions,
  getPrompt,
} from "../controllers/promptController.js";
import { checkParserHealth } from "../services/parserClient.js";

const router = Router();

const MAX_UPLOAD_BYTES = (Number(process.env.MAX_UPLOAD_SIZE_MB) || 50) * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

router.post("/documents", upload.single("file"), uploadDocument);
router.get("/documents", listAllDocuments);
router.get("/documents/:id", getDocument);
router.delete("/documents/:id", removeDocument);

router.post("/prompts", savePromptVersion);
router.get("/prompts", listAllPrompts);
router.get("/prompts/:namespace/versions", listVersions);
router.get("/prompts/:namespace", getPrompt);

router.get("/health/parser", async (req, res) => {
  const healthy = await checkParserHealth();
  res.status(healthy ? 200 : 503).json({ parser: healthy ? "healthy" : "unreachable" });
});

export default router;