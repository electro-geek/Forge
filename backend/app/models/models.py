import uuid
from datetime import datetime
from sqlalchemy import (
    String, Text, Integer, Boolean, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    firebase_uid: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    is_onboarded: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    api_key: Mapped["UserApiKey | None"] = relationship("UserApiKey", back_populates="user", uselist=False)
    projects: Mapped[list["Project"]] = relationship("Project", back_populates="user")


class UserApiKey(Base):
    __tablename__ = "user_api_keys"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True, nullable=False)
    provider: Mapped[str] = mapped_column(String, default="gemini")
    encrypted_key: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="api_key")


class Project(Base):
    __tablename__ = "projects"
    __table_args__ = (Index("ix_projects_user_id", "user_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    current_version_number: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="projects")
    chat_session: Mapped["ChatSession | None"] = relationship("ChatSession", back_populates="project", uselist=False, cascade="all, delete-orphan")
    versions: Mapped[list["ProjectVersion"]] = relationship("ProjectVersion", back_populates="project", order_by="ProjectVersion.version_number", cascade="all, delete-orphan")


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    __table_args__ = (Index("ix_chat_sessions_project_id", "project_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    project_id: Mapped[str] = mapped_column(String, ForeignKey("projects.id"), unique=True, nullable=False)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project: Mapped["Project"] = relationship("Project", back_populates="chat_session")
    messages: Mapped[list["Message"]] = relationship("Message", back_populates="session", order_by="Message.created_at", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (Index("ix_messages_session_id", "session_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    session_id: Mapped[str] = mapped_column(String, ForeignKey("chat_sessions.id"), nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)  # "user" | "assistant" | "system"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    version_id: Mapped[str | None] = mapped_column(String, ForeignKey("project_versions.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped["ChatSession"] = relationship("ChatSession", back_populates="messages")
    version: Mapped["ProjectVersion | None"] = relationship("ProjectVersion")


class ProjectVersion(Base):
    __tablename__ = "project_versions"
    __table_args__ = (
        Index("ix_project_versions_project_id", "project_id"),
        Index("ix_project_versions_project_latest", "project_id", "is_latest"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    project_id: Mapped[str] = mapped_column(String, ForeignKey("projects.id"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=True)   # The prompt that created this version
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)  # AI's explanation
    is_latest: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project: Mapped["Project"] = relationship("Project", back_populates="versions")
    files: Mapped[list["GeneratedFile"]] = relationship("GeneratedFile", back_populates="version", cascade="all, delete-orphan")


class GeneratedFile(Base):
    __tablename__ = "generated_files"
    __table_args__ = (Index("ix_generated_files_version_id", "version_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    version_id: Mapped[str] = mapped_column(String, ForeignKey("project_versions.id"), nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)   # e.g. "app/page.tsx"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str | None] = mapped_column(String, nullable=True)  # "tsx", "ts", "css"
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    version: Mapped["ProjectVersion"] = relationship("ProjectVersion", back_populates="files")
