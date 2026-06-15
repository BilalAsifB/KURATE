# Use a Python slim image optimized for standard ML dependencies
FROM python:3.11-slim

# Install system dependencies required for layout analysis and OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    poppler-utils \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml ./

# Resolve and install dependencies into the system environment
RUN uv pip install --system --no-cache-dir -e .

COPY src/ ./src/

# Pre-fetch Docling's layout/OCR models at build time so the first
# request isn't slowed down by a cold model download.
RUN python -c "from docling.document_converter import DocumentConverter; DocumentConverter()"

EXPOSE 8000

# Start Uvicorn pointing to the FastAPI app
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
