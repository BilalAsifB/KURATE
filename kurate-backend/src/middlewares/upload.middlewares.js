import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { APIError } from "../utils/APIError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up storage engine
const storage = multer.diskStorage({
    destination: (__, _, cb) => {
        cb(null, path.join(__dirname, "../../public/temp"));
    },
    filename: (_, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.filename + "-" + uniqueSuffix + path.extname(file.originalname));
    },
});

// File filter to accept only specific file types
const fileFilter = (_, file, cb) => {
    const allowedMimes = [
        "application/pdf",
        "application/epub+zip",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new APIError(
            400,
            "Invalid file type. Only PDF, EPUB, DOCX, TXT, and MD are allowed."
            )
            , false
        );
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB file size limit
    },
});