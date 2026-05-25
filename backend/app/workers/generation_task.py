import json
import redis as redis_sync
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.workers.celery_app import celery_app
from app.core.config import settings
from app.services.crypto import decrypt_api_key
from app.services.gemini import call_gemini, validate_generated_code


def get_sync_db():
    """Synchronous DB session for Celery tasks (psycopg2 driver)."""
    sync_url = settings.database_url.replace(
        "postgresql+asyncpg", "postgresql+psycopg2"
    )
    engine = create_engine(sync_url)
    Session = sessionmaker(bind=engine)
    return Session()


def publish_ws_event(session_id: str, event: dict):
    """Publish event to Redis pubsub channel for WebSocket delivery."""
    r = redis_sync.from_url(settings.redis_url)
    try:
        channel = f"ws:{session_id}"
        r.publish(channel, json.dumps(event))
    finally:
        r.close()


@celery_app.task(bind=True, max_retries=0)
def run_generation(
    self,
    user_id: str,
    project_id: str,
    session_id: str,
    prompt: str,
    encrypted_key: str,
    skill: str = "dark_pro",
):
    """
    Main generation task:
    1. Decrypt Gemini key
    2. Load chat history + latest files
    3. Call Gemini
    4. Validate code
    5. Save version + files + messages
    6. Publish result to WebSocket via Redis pubsub
    """
    from app.models.models import (
        Project, ChatSession, Message, ProjectVersion, GeneratedFile
    )

    db = get_sync_db()

    try:
        publish_ws_event(session_id, {"type": "status", "content": "generating"})

        gemini_key = decrypt_api_key(encrypted_key)

        session = db.query(ChatSession).filter(
            ChatSession.id == session_id
        ).first()
        if not session:
            raise ValueError(f"Session {session_id} not found")

        messages = db.query(Message).filter(
            Message.session_id == session_id,
            Message.role.in_(["user", "assistant"]),
        ).order_by(Message.created_at.asc()).all()

        history = [{"role": m.role, "content": m.content} for m in messages]

        latest_version = db.query(ProjectVersion).filter(
            ProjectVersion.project_id == project_id,
            ProjectVersion.is_latest == True,
        ).first()

        current_files = None
        if latest_version:
            files_rows = db.query(GeneratedFile).filter(
                GeneratedFile.version_id == latest_version.id
            ).all()
            current_files = {f.file_path: f.content for f in files_rows}

        user_msg = Message(
            session_id=session_id,
            role="user",
            content=prompt,
        )
        db.add(user_msg)
        db.commit()

        publish_ws_event(session_id, {"type": "status", "content": "calling_gemini"})
        result = call_gemini(
            api_key=gemini_key,
            chat_history=history,
            current_files=current_files,
            new_prompt=prompt,
            skill=skill,
        )

        summary = result.get("summary", "")
        generated_files = result.get("files", {})

        is_valid, error_msg = validate_generated_code(generated_files)
        if not is_valid:
            publish_ws_event(session_id, {
                "type": "error",
                "content": f"Generated code failed validation: {error_msg}",
            })
            return

        db.query(ProjectVersion).filter(
            ProjectVersion.project_id == project_id
        ).update({"is_latest": False})

        project = db.query(Project).filter(Project.id == project_id).first()
        new_version_num = (project.current_version_number or 0) + 1
        project.current_version_number = new_version_num

        new_version = ProjectVersion(
            project_id=project_id,
            version_number=new_version_num,
            prompt=prompt,
            summary=summary,
            is_latest=True,
        )
        db.add(new_version)
        db.flush()

        for file_path, content in generated_files.items():
            ext = file_path.rsplit(".", 1)[-1] if "." in file_path else ""
            lang_map = {"tsx": "tsx", "ts": "typescript", "css": "css", "json": "json", "js": "javascript"}
            language = lang_map.get(ext, ext)
            gen_file = GeneratedFile(
                version_id=new_version.id,
                file_path=file_path,
                content=content,
                language=language,
            )
            db.add(gen_file)

        assistant_msg = Message(
            session_id=session_id,
            role="assistant",
            content=summary,
            version_id=new_version.id,
        )
        db.add(assistant_msg)
        db.commit()

        if len(history) == 0 and session.title in (None, project.title):
            session.title = prompt[:60]
            db.commit()

        publish_ws_event(session_id, {
            "type": "files",
            "content": generated_files,
            "summary": summary,
            "version": new_version_num,
            "version_id": new_version.id,
        })

        publish_ws_event(session_id, {
            "type": "done",
            "version": new_version_num,
        })

    except Exception as exc:
        db.rollback()
        publish_ws_event(session_id, {
            "type": "error",
            "content": str(exc),
        })
    finally:
        db.close()
