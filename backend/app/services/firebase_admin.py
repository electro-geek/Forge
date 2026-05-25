import firebase_admin
from firebase_admin import credentials, auth
from pathlib import Path

from app.core.config import settings

_firebase_app = None


def init_firebase():
    global _firebase_app
    if _firebase_app is not None:
        return

    cred_path = Path(settings.firebase_credentials_path)
    if cred_path.exists():
        cred = credentials.Certificate(str(cred_path))
        _firebase_app = firebase_admin.initialize_app(cred)
    else:
        # Use application default credentials (for Cloud environments)
        _firebase_app = firebase_admin.initialize_app()


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded token payload.
    Raises firebase_admin.auth.InvalidIdTokenError if invalid.
    """
    decoded_token = auth.verify_id_token(id_token)
    return {
        "uid": decoded_token["uid"],
        "email": decoded_token.get("email", ""),
        "name": decoded_token.get("name"),
        "picture": decoded_token.get("picture"),
    }
