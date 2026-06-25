FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    poppler-utils \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml ./

RUN uv pip install --system --no-cache-dir -e .

COPY src/ ./src/

# Pre-fetch Docling layout/OCR models at build time so the first
# request isn't slowed by a cold model download.
RUN python -c "from docling.document_converter import DocumentConverter; DocumentConverter()"

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]