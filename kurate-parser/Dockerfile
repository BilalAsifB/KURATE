# Use a Python slim image optimized for standard ML dependencies
FROM python:3.11-slim

# Install system dependencies required for layout analysis and OCR
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    poppler-utils \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml .
RUN uv sync --no-cache-dir -r pyproject.toml

COPY src/ ./src/

EXPOSE 8000

# Start Uvicorn pointing to the FastAPI app
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]