"""
File storage abstraction.
MVP: stores code in PostgreSQL (handled by models).
Future: plug in MinIO/S3 here for zipped project exports.
"""
import json
import zipfile
import io
from typing import Optional


class FileStore:
    """
    Abstraction layer for file storage.
    Currently a no-op (files live in PostgreSQL).
    Swap out the implementation here when adding S3/MinIO.
    """

    def export_project_zip(self, files: dict[str, str], project_title: str) -> bytes:
        """
        Package all generated files into a downloadable zip.
        Returns raw zip bytes.
        """
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for file_path, content in files.items():
                # Strip leading slash
                clean_path = file_path.lstrip("/")
                zf.writestr(f"{project_title}/{clean_path}", content)
        buffer.seek(0)
        return buffer.read()

    def get_file_url(self, project_id: str, version_number: int, file_path: str) -> Optional[str]:
        """
        Future: return a signed S3/MinIO URL for a file.
        Currently returns None (files served from DB).
        """
        return None


file_store = FileStore()
