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
    settings = get_settings()

    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = settings.do_ocr
    pipeline_options.do_table_structure = settings.do_table_structure
    pipeline_options.generate_picture_images = settings.generate_picture_images
    pipeline_options.images_scale = settings.images_scale

    return DocumentConverter(
        allowed_formats=[InputFormat.PDF, InputFormat.DOCX],
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options),
            InputFormat.DOCX: WordFormatOption(),
        },
    )


def process_document(file_path: Path, document_id: str) -> dict[str, Any]:
    """Runs file_path through Docling, uploads figure images, returns
    structured markdown + UI-ready chunks."""
    converter = get_configured_converter()
    conv_result = converter.convert(file_path)
    doc = conv_result.document

    # Intercept and upload picture assets
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

        # Redirect Docling's markdown export to the hosted asset URL
        item.image.uri = public_url  # type: ignore[union-attr]

    markdown_output = doc.export_to_markdown()
    chunks = build_chunks(doc, image_urls)

    table_count = sum(
        1 for item, _ in doc.iterate_items(with_groups=False)
        if isinstance(item, TableItem)
    )
    logger.info(
        "Processed %s: %d chunks, %d images, %d tables",
        document_id, len(chunks), len(image_urls), table_count,
    )

    return {
        "document_id": document_id,
        "markdown": markdown_output,
        "chunks": chunks,
        "asset_count": len(image_urls),
    }
