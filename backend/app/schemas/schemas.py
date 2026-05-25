from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# --- User ---
class UserOut(BaseModel):
    id: str
    firebase_uid: str
    email: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    is_onboarded: bool
    created_at: datetime

    class Config:
        from_attributes = True


class VerifyTokenRequest(BaseModel):
    id_token: str


class VerifyTokenResponse(BaseModel):
    user: UserOut
    is_new_user: bool


# --- API Key ---
class SaveKeyRequest(BaseModel):
    gemini_api_key: str


class SaveKeyResponse(BaseModel):
    message: str


# --- Project ---
class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None


class ProjectOut(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    current_version_number: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Chat ---
class ChatSessionOut(BaseModel):
    id: str
    project_id: str
    title: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    version_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Generation ---
class GenerateRequest(BaseModel):
    project_id: str
    session_id: str
    prompt: str


class GenerateResponse(BaseModel):
    task_id: str
    message: str


# --- Version ---
class GeneratedFileOut(BaseModel):
    file_path: str
    content: str
    language: Optional[str]

    class Config:
        from_attributes = True


class VersionOut(BaseModel):
    id: str
    project_id: str
    version_number: int
    prompt: Optional[str]
    summary: Optional[str]
    is_latest: bool
    created_at: datetime
    files: list[GeneratedFileOut] = []

    class Config:
        from_attributes = True


class RestoreVersionResponse(BaseModel):
    message: str
    new_version: VersionOut


# --- WebSocket Messages ---
class WSMessage(BaseModel):
    type: str  # "generate", "ping"
    prompt: Optional[str] = None
    project_id: Optional[str] = None
    session_id: Optional[str] = None
