from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.models import User, Project, ChatSession, UserApiKey
from app.schemas.schemas import GenerateRequest, GenerateResponse
from app.core.dependencies import get_current_user
from app.workers.generation_task import run_generation

router = APIRouter()


@router.post("", response_model=GenerateResponse)
async def trigger_generation(
    body: GenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Queue a Celery generation job.
    Returns task_id for tracking via WebSocket.
    """
    # Verify project ownership
    proj_result = await db.execute(
        select(Project).where(
            Project.id == body.project_id,
            Project.user_id == current_user.id,
        )
    )
    project = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check user has a Gemini key
    key_result = await db.execute(
        select(UserApiKey).where(UserApiKey.user_id == current_user.id)
    )
    api_key_record = key_result.scalar_one_or_none()
    if not api_key_record:
        raise HTTPException(
            status_code=400,
            detail="No Gemini API key found. Please add one in settings.",
        )

    # Queue Celery task
    task = run_generation.delay(
        user_id=current_user.id,
        project_id=body.project_id,
        session_id=body.session_id,
        prompt=body.prompt,
        encrypted_key=api_key_record.encrypted_key,
    )

    return GenerateResponse(
        task_id=task.id,
        message="Generation started",
    )
