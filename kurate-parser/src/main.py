import logging
import os
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import aiofiles
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from src.config import get_settings
from src.pipeline import process_document

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

UPLOAD_DIR = Path(settings.upload_dir)


@asynccontextmanager
async def lifespan(app: FastAPI):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title=settings.app_name, version=settings.app_version, lifespan=lifespan)

# Validated by extension rather than client-supplied content_type, since
# browsers/clients send inconsistent MIME types for .docx in particular.
_ALLOWED_EXTENSIONS = {".pdf", ".docx"}
_MAX_UPLOAD_BYTES = settings.max_upload_size_mb * 1024 * 1024


@app.post("/api/v1/parse")
async def parse_document(file: UploadFile = File(...)):
    """Receives a PDF or DOCX, runs it through Docling, intercepts and
    uploads figure/table images to object storage, and returns structured
    Markdown plus UI-ready chunks for the orchestrator's `chunks` table.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename.")

    extension = Path(file.filename).suffix.lower()
    if extension not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{extension}'. Only PDF and DOCX are supported.",
        )

    document_id = str(uuid.uuid4())
    temp_file_path = UPLOAD_DIR / f"{document_id}{extension}"

    try:
        # --- 1. Stream upload to disk with a size guard ---
        size = 0
        async with aiofiles.open(temp_file_path, "wb") as out_file:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > _MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds {settings.max_upload_size_mb}MB limit.",
                    )
                await out_file.write(chunk)

        if size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        # --- 2. Run the Docling pipeline (CPU/GPU-bound; offload from event loop) ---
        result = await run_in_threadpool_safe(process_document, temp_file_path, document_id)

        return JSONResponse(content={"status": "success", **result})

    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to process document %s", document_id)
        raise HTTPException(status_code=500, detail=f"Processing failed: {exc}") from exc

    finally:
        # --- 3. Teardown: always clean up local disk space ---
        if temp_file_path.exists():
            os.remove(temp_file_path)


async def run_in_threadpool_safe(func, *args):
    """Runs a blocking function in a worker thread so the Docling
    conversion (CPU-bound, can take seconds-to-minutes) doesn't block
    the event loop for other requests / health checks."""
    import anyio

    return await anyio.to_thread.run_sync(func, *args)


@app.get("/health")
def health_check():
    return {"status": "healthy", "engine": "docling"}
