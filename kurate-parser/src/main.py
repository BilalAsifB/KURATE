import uuid
import os
import aiofiles
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from src.pipeline import process_document
from pathlib import Path

app = FastAPI(title="Kurate Parser Engine", version="1.0.0")

UPLOAD_DIR = Path("/tmp/kurate_uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@app.post("/api/v1/parse")
async def parse_document(file: UploadFile = File(...)):
    """Receives a document and returns structured Markdown."""
    if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and DOCX are supported.")

    document_id = str(uuid.uuid4())
    temp_file_path = UPLOAD_DIR / f"{document_id}_{file.filename}"

    try:
        # 1. Save file asynchronously
        async with aiofiles.open(temp_file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)

        # 2. Process via Docling Pipeline
        # In a high-traffic production system, you'd offload this to Celery/Redis
        # For Phase 1, synchronous execution inside the endpoint is fine.
        markdown_output = process_document(temp_file_path, document_id)

        return JSONResponse(content={
            "document_id": document_id,
            "status": "success",
            "markdown": markdown_output
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # 3. Teardown: Always clean up the local disk space
        if temp_file_path.exists():
            os.remove(temp_file_path)

@app.get("/health")
def health_check():
    return {"status": "healthy", "engine": "docling"}
