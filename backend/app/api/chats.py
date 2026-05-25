from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.models import User, Project, ChatSession, Message
from app.schemas.schemas import ChatSessionOut, MessageOut
from app.core.dependencies import get_current_user

router = APIRouter()


@router.get("/{project_id}/session", response_model=ChatSessionOut)
async def get_chat_session(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the chat session for a project."""
    # Verify project ownership
    proj_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(
        select(ChatSession).where(ChatSession.project_id == project_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session


@router.get("/{session_id}/messages", response_model=list[MessageOut])
async def get_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all messages for a chat session."""
    # Verify session belongs to user's project
    sess_result = await db.execute(
        select(ChatSession)
        .options(selectinload(ChatSession.project))
        .where(ChatSession.id == session_id)
    )
    session = sess_result.scalar_one_or_none()
    if not session or session.project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    result = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at.asc())
    )
    return result.scalars().all()
