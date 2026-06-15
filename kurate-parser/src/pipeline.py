import io
import logging
from pathlib import Path
from typing import Any

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption, WordFormatOption
from docling_core.types.doc import PictureItem, TableItem

from src.config import get_settings
from src.utils.md_formatter import build_chunks
from src.utils.s3_uploader import S3Uploader

logger = logging.getLogger(__name__)

uploader = S3Uploader()


def get_configured_converter() -> DocumentConverter:
    """Configures the ML layout/OCR pipeline for PDF and DOCX inputs."""
    settings = get_settings()

    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = settings.do_ocr
    pipeline_options.do_table_structure = settings.do_table_structure
    pipeline_options.generate_picture_images = settings.generate_picture_images
    pipeline_options.images_scale = settings.images_scale

    converter = DocumentConverter(
        allowed_formats=[InputFormat.PDF, InputFormat.DOCX],
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options),
            InputFormat.DOCX: WordFormatOption(),
        },
    )
    return converter


def process_document(file_path: Path, document_id: str) -> dict[str, Any]:
    """Runs `file_path` through Docling, intercepts every figure/table image,
    uploads the crop to object storage, and returns both the full Markdown
    (with asset URLs inlined) and a flat list of UI-ready chunks.

    Returns:
        {
            "document_id": str,
            "markdown": str,          # full document, asset URLs inlined
            "chunks": list[dict],     # one row per structural element
            "asset_count": int,
        }
    """
    converter = get_configured_converter()
    conv_result = converter.convert(file_path)
    doc = conv_result.document

    # --- 1. Intercept and upload picture assets, keyed by item identity ---
    image_urls: dict[int, str] = {}

    for item, _level in doc.iterate_items(with_groups=False, traverse_pictures=False):
        if not isinstance(item, PictureItem):
            continue

        pil_image = item.get_image(doc)
        if pil_image is None:
            continue

        buffer = io.BytesIO()
        pil_image.save(buffer, format="PNG")
        image_bytes = buffer.getvalue()

        public_url = uploader.upload_image(
            image_bytes, document_id, extension="png", content_type="image/png"
        )
        image_urls[id(item)] = public_url

        # Redirect Docling's own markdown/HTML export to the hosted asset
        # instead of an embedded base64 data URI.
        item.image.uri = public_url  # type: ignore[union-attr]

    # --- 2. Export full document Markdown (now pointing at hosted assets) ---
    markdown_output = doc.export_to_markdown()

    # --- 3. Build granular chunks for the orchestrator/registry DB ---
    chunks = build_chunks(doc, image_urls)

    table_count = sum(
        1 for item, _ in doc.iterate_items(with_groups=False) if isinstance(item, TableItem)
    )
    logger.info(
        "Processed document %s: %d chunks, %d images, %d tables",
        document_id,
        len(chunks),
        len(image_urls),
        table_count,
    )

    return {
        "document_id": document_id,
        "markdown": markdown_output,
        "chunks": chunks,
        "asset_count": len(image_urls),
    }
