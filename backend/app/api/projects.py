from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime

from app.db.database import get_db
from app.models.models import User, Project, ChatSession, Message
from app.schemas.schemas import ProjectCreate, ProjectOut
from app.core.dependencies import get_current_user

router = APIRouter()


@router.get("", response_model=list[ProjectOut])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project)
        .where(Project.user_id == current_user.id)
        .order_by(Project.updated_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=ProjectOut)
async def create_project(
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = Project(
        user_id=current_user.id,
        title=body.title,
        description=body.description,
        current_version_number=0,
    )
    db.add(project)
    await db.flush()

    # Auto-create a chat session for this project
    session = ChatSession(
        project_id=project.id,
        title=body.title,
    )
    db.add(session)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Null out Message.version_id FKs before cascade deletes ProjectVersion rows
    chat_session = await db.execute(
        select(ChatSession).where(ChatSession.project_id == project_id)
    )
    session = chat_session.scalar_one_or_none()
    if session:
        await db.execute(
            update(Message)
            .where(Message.session_id == session.id)
            .values(version_id=None)
        )

    await db.delete(project)
    await db.commit()
    return {"message": "Project deleted"}
