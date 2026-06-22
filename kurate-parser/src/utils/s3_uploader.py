import io
import logging
import uuid

import boto3
from botocore.client import Config as BotoConfig
from botocore.exceptions import BotoCoreError, ClientError

from src.config import get_settings

logger = logging.getLogger(__name__)


class S3Uploader:
    """Uploads cropped figure/table images to S3 or MinIO.

    Falls back to a local mock URL when no bucket is configured so the
    pipeline remains runnable without cloud credentials during development.
    """

    def __init__(self):
        settings = get_settings()
        self.bucket_name = settings.s3_bucket_name
        self.public_base_url = settings.s3_public_base_url
        self.endpoint_url = settings.s3_endpoint_url
        self.region = settings.aws_region

        self._client = None
        if self.bucket_name:
            client_kwargs = {
                "service_name": "s3",
                "region_name": self.region,
            }
            if settings.aws_access_key_id and settings.aws_secret_access_key:
                client_kwargs["aws_access_key_id"] = settings.aws_access_key_id
                client_kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
            if self.endpoint_url:
                client_kwargs["endpoint_url"] = self.endpoint_url
            if settings.s3_force_path_style:
                client_kwargs["config"] = BotoConfig(s3={"addressing_style": "path"})

            self._client = boto3.client(**client_kwargs)

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    def upload_image(
        self,
        image_bytes: bytes,
        document_id: str,
        extension: str = "png",
        content_type: str = "image/png",
    ) -> str:
        asset_id = uuid.uuid4().hex
        image_key = f"assets/{document_id}/{asset_id}.{extension}"

        if not self.is_configured:
            return f"local-mock://{image_key}"

        try:
            self._client.upload_fileobj(
                io.BytesIO(image_bytes),
                self.bucket_name,
                image_key,
                ExtraArgs={"ContentType": content_type},
            )
        except (BotoCoreError, ClientError) as exc:
            logger.error("Failed to upload asset %s: %s", image_key, exc)
            return f"local-mock://{image_key}"

        return self._build_public_url(image_key)

    def _build_public_url(self, key: str) -> str:
        if self.public_base_url:
            return f"{self.public_base_url.rstrip('/')}/{key}"
        if self.endpoint_url:
            return f"{self.endpoint_url.rstrip('/')}/{self.bucket_name}/{key}"
        return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{key}"
