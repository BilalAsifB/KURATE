# kurate-parser

Multimodal document ingestion microservice for KURATE.

## What it does

`POST /api/v1/parse` accepts a PDF or DOCX, runs it through [Docling](https://github.com/docling-project/docling)
for layout detection, OCR, and table-structure recognition, then:

1. Intercepts every figure/table image, crops it, and uploads it to S3/MinIO.
2. Rewrites the document's image references to point at the uploaded asset URLs.
3. Exports the full document as Markdown (with hosted asset URLs inlined).
4. Splits the document into an ordered list of granular chunks
   (`text`, `heading`, `table`, `image`, `code`, `formula`, `list_item`)
   ready for `kurate-backend` to persist as `chunks` rows.

## Response shape

```json
{
  "status": "success",
  "document_id": "uuid",
  "markdown": "# Title\n\n...full doc with ![](https://bucket.s3.../assets/...) ...",
  "chunks": [
    {"order": 0, "type": "heading", "content": "# Title", "metadata": {"level": 1, "label": "title", "self_ref": "#/texts/0"}},
    {"order": 1, "type": "table", "content": "| a | b |\n|---|---|\n| 1 | 2 |", "metadata": {"num_rows": 2, "num_cols": 2}},
    {"order": 2, "type": "image", "content": "https://bucket.s3.../assets/<doc_id>/<uuid>.png", "metadata": {"caption": "Figure 1"}}
  ],
  "asset_count": 1
}
```

## Configuration

All config is via environment variables (see `src/config.py`):

| Variable | Default | Notes |
|---|---|---|
| `S3_BUCKET_NAME` | unset | If unset, image uploads return `local-mock://...` URLs |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | unset | Required for AWS S3; optional for MinIO if anonymous |
| `AWS_REGION` | `us-east-1` | |
| `S3_ENDPOINT_URL` | unset | Set to e.g. `http://minio:9000` for MinIO |
| `S3_FORCE_PATH_STYLE` | `false` | Set `true` for most MinIO deployments |
| `S3_PUBLIC_BASE_URL` | unset | Override for CDN-fronted asset URLs |
| `MAX_UPLOAD_SIZE_MB` | `50` | Request body size guard |
| `DO_OCR` | `true` | |
| `DO_TABLE_STRUCTURE` | `true` | |

## Local development

```bash
uv pip install --system -e .
uvicorn src.main:app --reload
```

```bash
curl -F "file=@spec.pdf" http://localhost:8000/api/v1/parse
```

## Notes / next steps

- Docling conversion is CPU-bound and runs in a worker thread so it doesn't
  block the event loop; for high throughput, move it to a Celery/RQ worker
  fronted by a queue.
- File type is validated by extension (`.pdf` / `.docx`), not client-supplied
  `Content-Type`, since browsers send inconsistent MIME types for DOCX.
- Image assets are re-encoded as PNG via Pillow before upload.
