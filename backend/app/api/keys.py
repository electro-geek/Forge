from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.db.database import get_db
from app.models.models import User, UserApiKey
from app.schemas.schemas import SaveKeyRequest, SaveKeyResponse
from app.services.crypto import encrypt_api_key
from app.core.dependencies import get_current_user

router = APIRouter()


@router.post("/gemini", response_model=SaveKeyResponse)
async def save_gemini_key(
    body: SaveKeyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Encrypt and save the user's Gemini API key.
    Updates if already exists.
    """
    if not body.gemini_api_key.strip():
        raise HTTPException(status_code=400, detail="API key cannot be empty")

    encrypted = encrypt_api_key(body.gemini_api_key.strip())

    result = await db.execute(
        select(UserApiKey).where(UserApiKey.user_id == current_user.id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.encrypted_key = encrypted
        existing.updated_at = datetime.utcnow()
    else:
        new_key = UserApiKey(
            user_id=current_user.id,
            provider="gemini",
            encrypted_key=encrypted,
        )
        db.add(new_key)

    # Mark user as onboarded
    current_user.is_onboarded = True
    await db.commit()

    return SaveKeyResponse(message="Gemini API key saved successfully")


@router.delete("/gemini", response_model=SaveKeyResponse)
async def delete_gemini_key(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete the stored Gemini API key."""
    result = await db.execute(
        select(UserApiKey).where(UserApiKey.user_id == current_user.id)
    )
    key = result.scalar_one_or_none()
    if key:
        await db.delete(key)
        current_user.is_onboarded = False
        await db.commit()

    return SaveKeyResponse(message="Gemini API key deleted")
