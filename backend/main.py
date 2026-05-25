from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.db.database import engine, Base
from app.api import auth, projects, chats, generate, versions, keys
from app.websocket.ws_handler import router as ws_router
from app.core.config import settings
from app.services.firebase_admin import init_firebase


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_firebase()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="UIWiz API",
    description="AI-powered Next.js UI generator backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(keys.router, prefix="/keys", tags=["keys"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(chats.router, prefix="/chats", tags=["chats"])
app.include_router(generate.router, prefix="/generate", tags=["generate"])
app.include_router(versions.router, prefix="/versions", tags=["versions"])
app.include_router(ws_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "uiwiz-api"}
