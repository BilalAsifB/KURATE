import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { Document } from "../models/document.models.js";
import {
    parseEPUB,
    parsePDF,
    parseDOCX,
    parseText,
} from "../utils/documentParsers.js";
import axios from "axios";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import fs from "fs";

const parseDocument = async (filePath, fileType, userId, documentId) => {
    try {
        let parsedContent;

        switch (fileType.toLowerCase()) {
            case "application/epub+zip":
                parsedContent = await parseEPUB(filePath);
                break;
            case "application/pdf":
                parsedContent = await parsePDF(filePath);
                break;
            case
 "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                parsedContent = await parseDOCX(filePath);
                break;
            case "text/plain":
            case "text/markdown":
                parsedContent = await parseText(filePath);
                break;
            default:
                throw new Error("Unsupported file type");
        }

        // Update the document in DB with parsed content
        await Document.findByIdAndUpdate(
            documentId,
            {
                status: "ready",
                parsedContent,
            },
            { new: true }
        );

        // Clean the temp file
        fs.unlink(filePath, (err) => {
            if (err) console.error("Error deleting temp file:", err);
        });
    } catch (error) {
        console.error("Error parsing document:", error);
        // Update document status to 'error'
        await Document.findByIdAndUpdate(
            documentId,
            { status: "error" },
            { new: true }
        );
    }
};

const parseURL = async (url, userId, documentId) => {
    try {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
            },
        });

        const dom = new JSDOM(response.data, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article) {
            throw new Error("Failed to parse article content");
        }

        const parsedContent = {
            toc: [
                {
                    title: article.title || "Untitled",
                    sectionId: "main",
                },
            ],
            sections: new Map([
                [
                    "main",
                    `# ${article.title || "Untitled"}\n\n${article.content || article.textContent}`,
                ],
            ]),
            images: [],
        };

        // Update the document in DB with parsed content
        await Document.findByIdAndUpdate(
            documentId,
            {
                status: "ready",
                parsedContent,
            },
            { new: true }
        );
    } catch (error) {
        console.error("Error parsing URL:", error);

        // Update document status to 'error'
        await Document.findByIdAndUpdate(
            documentId,
            { status: "error" },
            { new: true }
        );
    }
};

export const uploadDocument = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new APIError(400, "No file uploaded");
    }

    const { originalname, mimetype, path: filePath, size } = req.file;
    const userId = req.user.id;

    // Create a new document entry in DB with status 'processing'
    const newDocument = await Document.create({
        user: userId,
        title: originalname.replace(/\.[^/.]+$/, ""), // Remove file extension
        sourceType: mimetype,
        originalFileName: originalname,
        status: "processing",
    });

    // Start parsing the document asynchronously
    setImmediate(() => {
        parseDocument(filePath, mimetype, userId, newDocument._id);
    });

    return res.status(202).json(
        new APIResponse(
            202,
            {
                documentId: newDocument._id,
                title: newDocument.title,
                status: "processing",
            }, 
            "File received. Processing started. Check back soon."
        )
    );
});

export const submitDocumentURL = asyncHandler(async (req, res) => {
    const { url } = req.body;

    if (!url || url.trim() === "") {
        throw new APIError(400, "URL is required");
    }

    // Validate URL format
    try {
        new URL(url);
    } catch (error) {
        throw new APIError(400, "Invalid URL format");
    }

    const userId = req.user.id;

    // Extract domain as title
    const urlObj = new URL(url);
    const title = urlObj.hostname;

    // Create a new document entry in DB with status 'processing'
    const newDocument = await Document.create({
        user: userId,
        title,
        sourceType: "url",
        originalUrl: url,
        status: "processing",
    });

    // Start parsing the URL asynchronously
    setImmediate(() => {
        parseURL(url, userId, newDocument._id);
    });

    return res.status(202).json(
        new APIResponse(
            202,
            {
                documentId: newDocument._id,
                title: newDocument.title,
                status: "processing",
            },
            "URL received. Processing started. Check back soon."
        )
    );
});

export const getAllDocuments = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get only TOC and basic info for all documents
    const documents = await Document.find({ user: userId })
    .select("-parsedContent.sections -parsedContent.images")
    .sort({ createdAt: -1 });
    
    return res.status(200).json(
        new APIResponse(200, documents, "Documents retrieved successfully")
    );
});

export const getDocumentById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify document belongs to user
    const document = await Document.findOne({ _id: id, user: userId });

    if (!document) {
        throw new APIError(404, "Document not found or you don't have access to it");
    }

    // If still processing, return current status
    if (document.status === "processing") {
        return res.status(200).json(
            new APIResponse(
                200,
                {
                    ...document.toObject(),
                    parsedContent: null,
                },
                "Document is still being processed"
            )
        );
    }

    // If error, return error status
    if (document.status === "error") {
        return res.status(200).json(
            new APIResponse(
                200,
                {
                    ...document.toObject(),
                    parsedContent: null,
                },
                "Document processing failed"
            )
        );
    }

    // Convert sections Map to object for JSON serialization
    const documentObj = document.toObject();
    if (documentObj.parsedContent?.sections) {
        documentObj.parsedContent.sections = Object.fromEntries(
            documentObj.parsedContent.sections
        );
    }

    return res.status(200).json(
        new APIResponse(200, documentObj, "Document retrieved successfully")
    );
});

export const deleteDocument = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify document belongs to user
    const document = await Document.findOne({ _id: id, user: userId });

    if (!document) {
        throw new APIError(404, "Document not found or you don't have access to it");
    }

    // Delete the document
    await Document.deleteOne({ _id: id, user: userId });

    return res.status(200).json(
        new APIResponse(200, null, "Document deleted successfully")
    );  
});