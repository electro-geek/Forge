from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import VerifyTokenRequest, VerifyTokenResponse, UserOut
from app.services.firebase_admin import verify_firebase_token

router = APIRouter()


@router.post("/verify", response_model=VerifyTokenResponse)
async def verify_token(
    body: VerifyTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify Firebase ID token. Creates user in DB if first time.
    Returns user object + is_new_user flag.
    """
    try:
        token_data = verify_firebase_token(body.id_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

    # Look up existing user
    result = await db.execute(
        select(User).where(User.firebase_uid == token_data["uid"])
    )
    user = result.scalar_one_or_none()
    is_new = False

    if not user:
        # Create new user
        user = User(
            firebase_uid=token_data["uid"],
            email=token_data["email"],
            display_name=token_data.get("name"),
            avatar_url=token_data.get("picture"),
            is_onboarded=False,
        )
        db.add(user)
        await db.flush()
        is_new = True
    else:
        # Update profile info in case it changed
        user.display_name = token_data.get("name") or user.display_name
        user.avatar_url = token_data.get("picture") or user.avatar_url
        user.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(user)
    return VerifyTokenResponse(user=UserOut.model_validate(user), is_new_user=is_new)


@router.get("/me", response_model=UserOut)
async def get_me(
    db: AsyncSession = Depends(get_db),
    # Re-implement inline to avoid circular import
):
    """Get current user — typically called after token verification on frontend."""
    pass  # Handled by verify endpoint; kept for future use
