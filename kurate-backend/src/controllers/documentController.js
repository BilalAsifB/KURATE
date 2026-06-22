import {
  createDocument, markDocumentReady, markDocumentFailed,
  getDocumentById, listDocuments, deleteDocument,
  insertChunks, getChunksByDocumentId,
} from "../database/repository.js";
import { parseDocument } from "../services/parserClient.js";

const EXTENSION_TO_SOURCE_TYPE = { ".pdf": "pdf", ".docx": "docx" };

function getExtension(filename) {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx).toLowerCase();
}

export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Use form field 'file'." });
    }
    const extension = getExtension(req.file.originalname);
    const sourceType = EXTENSION_TO_SOURCE_TYPE[extension];
    if (!sourceType) {
      return res.status(400).json({ error: `Unsupported file type '${extension}'.` });
    }

    const document = await createDocument({ filename: req.file.originalname, sourceType });

    try {
      const parsed = await parseDocument(req.file.buffer, req.file.originalname, req.file.mimetype);
      await insertChunks(document.id, parsed.chunks || []);
      const ready = await markDocumentReady({
        documentId: document.id,
        markdown: parsed.markdown,
        assetCount: parsed.asset_count || 0,
      });
      const chunks = await getChunksByDocumentId(document.id);
      return res.status(201).json({ document: ready, chunks });
    } catch (parseErr) {
      await markDocumentFailed({ documentId: document.id, errorMessage: parseErr.message });
      return res.status(502).json({
        error: "Document parsing failed.",
        detail: parseErr.message,
        document_id: document.id,
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function listAllDocuments(req, res, next) {
  try {
    res.json({ documents: await listDocuments() });
  } catch (err) { next(err); }
}

export async function getDocument(req, res, next) {
  try {
    const document = await getDocumentById(req.params.id);
    if (!document) return res.status(404).json({ error: "Document not found." });
    const chunks = await getChunksByDocumentId(req.params.id);
    res.json({ document, chunks });
  } catch (err) { next(err); }
}

export async function removeDocument(req, res, next) {
  try {
    const deleted = await deleteDocument(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Document not found." });
    res.status(204).send();
  } catch (err) { next(err); }
}