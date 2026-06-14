from pathlib import Path
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.base_models import InputFormat
from src.utils.s3_uploader import S3Uploader

uploader = S3Uploader()

def get_configured_converter() -> DocumentConverter:
    """Configures the ML layout parser."""
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_table_structure = True 
    pipeline_options.do_ocr = True 
    pipeline_options.extract_images = True 

    converter = DocumentConverter(
        allowed_formats=[InputFormat.PDF, InputFormat.DOCX],
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )
    return converter

def process_document(file_path: Path, document_id: str) -> str:
    """
    Runs the document through Docling, intercepts images, 
    uploads them, and returns standard Markdown.
    """
    converter = get_configured_converter()
    conv_result = converter.convert(file_path)
    
    # Example logic to intercept and replace images 
    # (Note: Docling's exact image extraction API evolves, but this is the structural pattern)
    doc_tree = conv_result.document
    
    for element in doc_tree.elements():
        if element.type == 'image' or element.type == 'figure':
            # Extract raw bytes of the cropped figure
            image_bytes = element.get_image_bytes() 
            if image_bytes:
                public_url = uploader.upload_image(image_bytes, document_id)
                # Mutate the element so the final markdown render uses the S3 URL
                element.image_uri = public_url

    # Export the mutated document tree to Markdown
    return doc_tree.export_to_markdown()
