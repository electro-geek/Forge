import json
import asyncio
import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.db.database import AsyncSessionLocal
from app.models.models import User, Project, ChatSession, UserApiKey
from app.services.firebase_admin import verify_firebase_token
from app.workers.generation_task import run_generation

router = APIRouter()

GENERATION_TIMEOUT = 180  # seconds before giving up on a stuck Celery task


async def get_user_from_token(token: str, db: AsyncSession) -> User | None:
    try:
        token_data = verify_firebase_token(token)
    except Exception:
        return None

    result = await db.execute(
        select(User).where(User.firebase_uid == token_data["uid"])
    )
    return result.scalar_one_or_none()


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(...),
):
    await websocket.accept()

    async with AsyncSessionLocal() as db:
        user = await get_user_from_token(token, db)
        if not user:
            await websocket.send_json({"type": "error", "content": "Unauthorized"})
            await websocket.close(code=4001)
            return

        sess_result = await db.execute(
            select(ChatSession).where(ChatSession.id == session_id)
        )
        session = sess_result.scalar_one_or_none()
        if not session:
            await websocket.send_json({"type": "error", "content": "Session not found"})
            await websocket.close(code=4004)
            return

        key_result = await db.execute(
            select(UserApiKey).where(UserApiKey.user_id == user.id)
        )
        api_key_record = key_result.scalar_one_or_none()
        if not api_key_record:
            await websocket.send_json({
                "type": "error",
                "content": "No Gemini API key. Please add one in settings.",
            })
            await websocket.close(code=4002)
            return

        project_id = session.project_id

    await websocket.send_json({"type": "connected", "session_id": session_id})

    redis_client = aioredis.from_url(settings.redis_url)
    pubsub = redis_client.pubsub()
    channel = f"ws:{session_id}"
    await pubsub.subscribe(channel)

    async def drain_redis_to_ws() -> bool:
        """
        Forward Redis pubsub events to the WebSocket until "done"/"error".
        Returns True if generation finished cleanly, False if the WS closed.
        Times out after GENERATION_TIMEOUT seconds.
        """
        deadline = asyncio.get_event_loop().time() + GENERATION_TIMEOUT
        async for message in pubsub.listen():
            if message["type"] != "message":
                continue
            data = json.loads(message["data"])
            try:
                await websocket.send_json(data)
            except Exception:
                return False
            if data.get("type") in ("done", "error"):
                return True
            if asyncio.get_event_loop().time() > deadline:
                try:
                    await websocket.send_json({
                        "type": "error",
                        "content": "Generation timed out. Try again.",
                    })
                except Exception:
                    pass
                return False
        return False

    try:
        while True:
            # Use asyncio.wait to listen for both: new WS message OR disconnect
            receive_task = asyncio.ensure_future(websocket.receive_text())
            try:
                raw = await asyncio.wait_for(receive_task, timeout=300)
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "error", "content": "Connection timed out"})
                break

            msg = json.loads(raw)

            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if msg.get("type") == "generate":
                prompt = msg.get("prompt", "").strip()
                if not prompt:
                    await websocket.send_json({"type": "error", "content": "Empty prompt"})
                    continue

                skill = msg.get("skill", "dark_pro")
                run_generation.delay(
                    user_id=user.id,
                    project_id=project_id,
                    session_id=session_id,
                    prompt=prompt,
                    encrypted_key=api_key_record.encrypted_key,
                    skill=skill,
                )

                # Drain Redis events until done/error, with timeout
                await drain_redis_to_ws()

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.aclose()
        await redis_client.aclose()
        try:
            await websocket.close()
        except Exception:
            pass
