from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized configuration for the Kurate Parser microservice."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Service ---
    app_name: str = "Kurate Parser Engine"
    app_version: str = "1.0.0"
    upload_dir: str = "/tmp/kurate_uploads"
    max_upload_size_mb: int = 50

    # --- Docling pipeline ---
    do_ocr: bool = True
    do_table_structure: bool = True
    generate_picture_images: bool = True
    images_scale: float = 2.0

    # --- Object storage (S3 / MinIO) ---
    s3_bucket_name: str | None = None
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    aws_region: str = "us-east-1"
    s3_endpoint_url: str | None = None
    s3_public_base_url: str | None = None
    s3_force_path_style: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
