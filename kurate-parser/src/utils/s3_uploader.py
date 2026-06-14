import os
import boto3
import uuid
from botocore.exceptions import NoCredentialsError

class S3Uploader:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'us-east-1')
        )
        self.bucket_name = os.getenv('S3_BUCKET_NAME')

    def upload_image(self, image_bytes: bytes, document_id: str, extension: str = "png") -> str:
        """Uploads raw image bytes to S3 and returns the public URL."""
        if not self.bucket_name:
            # Fallback for local testing if S3 isn't configured yet
            return f"local_mock_url/{document_id}/{uuid.uuid4()}.{extension}"

        image_key = f"assets/{document_id}/{uuid.uuid4()}.{extension}"
        
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=image_key,
                Body=image_bytes,
                ContentType=f'image/{extension}',
                # ACL='public-read' # Uncomment if your bucket allows public ACLs
            )
            # Construct the public URL (Assumes standard AWS S3 format)
            return f"https://{self.bucket_name}.s3.amazonaws.com/{image_key}"
        except NoCredentialsError:
            print("S3 Credentials not available.")
            return None
            