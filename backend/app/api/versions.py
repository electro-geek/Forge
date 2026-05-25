from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.models import User, Project, ProjectVersion, GeneratedFile, Message, ChatSession
from app.schemas.schemas import VersionOut, RestoreVersionResponse
from app.core.dependencies import get_current_user

router = APIRouter()


@router.get("/{project_id}", response_model=list[VersionOut])
async def list_versions(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all versions (metadata only, no file content)."""
    proj_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(
        select(ProjectVersion)
        .where(ProjectVersion.project_id == project_id)
        .order_by(ProjectVersion.version_number.desc())
    )
    return result.scalars().all()


@router.get("/{project_id}/{version_id}", response_model=VersionOut)
async def get_version(
    project_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single version with its files."""
    proj_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(
        select(ProjectVersion)
        .options(selectinload(ProjectVersion.files))
        .where(
            ProjectVersion.id == version_id,
            ProjectVersion.project_id == project_id,
        )
    )
    version = result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version


@router.get("/{project_id}/latest", response_model=VersionOut)
async def get_latest_version(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the latest version with all files."""
    proj_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
    )
    project = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(
        select(ProjectVersion)
        .options(selectinload(ProjectVersion.files))
        .where(
            ProjectVersion.project_id == project_id,
            ProjectVersion.is_latest == True,
        )
    )
    version = result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=404, detail="No versions yet")
    return version


@router.post("/{project_id}/restore/{version_id}", response_model=RestoreVersionResponse)
async def restore_version(
    project_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Restore a previous version by creating a new version snapshot from it.
    Non-destructive: old versions preserved.
    """
    proj_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
    )
    project = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get the version to restore
    ver_result = await db.execute(
        select(ProjectVersion)
        .options(selectinload(ProjectVersion.files))
        .where(
            ProjectVersion.id == version_id,
            ProjectVersion.project_id == project_id,
        )
    )
    old_version = ver_result.scalar_one_or_none()
    if not old_version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Mark all existing versions as not latest
    await db.execute(
        update(ProjectVersion)
        .where(ProjectVersion.project_id == project_id)
        .values(is_latest=False)
    )

    # Create new version from old files
    new_version_num = project.current_version_number + 1
    project.current_version_number = new_version_num

    new_version = ProjectVersion(
        project_id=project_id,
        version_number=new_version_num,
        prompt=f"Restored from version {old_version.version_number}",
        summary=f"Restored from v{old_version.version_number}",
        is_latest=True,
    )
    db.add(new_version)
    await db.flush()

    # Copy files
    for f in old_version.files:
        new_file = GeneratedFile(
            version_id=new_version.id,
            file_path=f.file_path,
            content=f.content,
            language=f.language,
        )
        db.add(new_file)

    # Save a message in the chat about the restore
    sess_result = await db.execute(
        select(ChatSession).where(ChatSession.project_id == project_id)
    )
    session = sess_result.scalar_one_or_none()
    if session:
        restore_msg = Message(
            session_id=session.id,
            role="system",
            content=f"Restored to version {old_version.version_number}",
            version_id=new_version.id,
        )
        db.add(restore_msg)

    await db.commit()
    await db.refresh(new_version)

    return RestoreVersionResponse(
        message=f"Restored to version {old_version.version_number}",
        new_version=VersionOut.model_validate(new_version),
    )
