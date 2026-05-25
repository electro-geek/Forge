import base64
import hashlib
from cryptography.fernet import Fernet

from app.core.config import settings


def _get_fernet() -> Fernet:
    """
    Derive a 32-byte Fernet key from the secret_key in config.
    Fernet requires a URL-safe base64-encoded 32-byte key.
    """
    key_bytes = settings.secret_key.encode("utf-8")
    derived = hashlib.sha256(key_bytes).digest()
    fernet_key = base64.urlsafe_b64encode(derived)
    return Fernet(fernet_key)


def encrypt_api_key(plaintext_key: str) -> str:
    """Encrypt the Gemini API key before storing in DB."""
    f = _get_fernet()
    encrypted = f.encrypt(plaintext_key.encode("utf-8"))
    return encrypted.decode("utf-8")


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt the Gemini API key for use in API calls."""
    f = _get_fernet()
    decrypted = f.decrypt(encrypted_key.encode("utf-8"))
    return decrypted.decode("utf-8")
