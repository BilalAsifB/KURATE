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
_ALLOWED_EXTENSIONS = {".pdf", ".docx"}
_MAX_UPLOAD_BYTES = settings.max_upload_size_mb * 1024 * 1024


@asynccontextmanager
async def lifespan(app: FastAPI):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)


@app.post("/api/v1/parse")
async def parse_document(file: UploadFile = File(...)):
    """Accepts a PDF or DOCX, parses it with Docling, uploads figure images
    to object storage, and returns structured markdown + UI-ready chunks."""
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

        result = await run_in_threadpool(process_document, temp_file_path, document_id)
        return JSONResponse(content={"status": "success", **result})

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to process document %s", document_id)
        raise HTTPException(status_code=500, detail=f"Processing failed: {exc}") from exc
    finally:
        if temp_file_path.exists():
            os.remove(temp_file_path)


async def run_in_threadpool(func, *args):
    """Runs a CPU-bound function in a worker thread so Docling conversion
    doesn't block the event loop."""
    import anyio
    return await anyio.to_thread.run_sync(func, *args)


@app.get("/health")
def health_check():
    return {"status": "healthy", "engine": "docling"}
