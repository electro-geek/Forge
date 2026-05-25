# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIWiz is an AI-powered Next.js UI generator. Users describe a UI in natural language; the backend calls Gemini to generate Next.js/TypeScript/Tailwind code; the frontend previews it live via Sandpack. Each iteration creates a versioned snapshot that users can browse and restore.

## Architecture

```
frontend (Next.js 14)  ←→  backend (FastAPI)  ←→  Celery worker  ←→  Gemini API
         ↑                        ↓                      ↑
    Firebase Auth           PostgreSQL              Redis pubsub
                            (SQLAlchemy)           (broker + result backend)
```

**Generation flow:**
1. Frontend opens a WebSocket to `/ws/{session_id}?token={firebase_token}`
2. User sends `{ type: "generate", prompt }` over the socket
3. Backend enqueues a Celery task (`run_generation`)
4. Worker calls Gemini, saves a new `ProjectVersion` + `GeneratedFile` rows, publishes events to Redis pubsub channel `ws:{session_id}`
5. WebSocket handler relays events to client: `status` → `files` → `done`
6. Frontend updates Zustand stores; Sandpack re-renders the live preview

**Important duality:** The FastAPI app uses `asyncpg` (async SQLAlchemy) everywhere. The Celery worker is synchronous and uses `psycopg2`; it converts the database URL at runtime (`postgresql+asyncpg` → `postgresql+psycopg2`).

## Backend

### Running locally

```bash
cd backend
# Start infrastructure
docker compose up postgres redis -d

# Install deps
pip install -r requirements.txt

# Run API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run Celery worker (separate terminal)
celery -A app.workers.celery_app worker --loglevel=info --concurrency=4
```

### Tests

```bash
cd backend
pytest tests/test_api.py -v
# Single test
pytest tests/test_api.py::test_health -v
```

### Configuration

All settings live in `backend/config.properties` (INI format, read by `app/core/config.py`). Environment variables are fallbacks. Key sections: `[database]`, `[redis]`, `[firebase]`, `[security]`, `[app]`.

- `secret_key` in `[security]` is used to derive the Fernet key that encrypts user Gemini API keys at rest.
- `credentials_path` in `[firebase]` must point to the Firebase service account JSON.

### Database migrations

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

Migrations live in `app/db/migrations/`. The app also calls `Base.metadata.create_all` on startup (dev convenience), but Alembic is the canonical migration tool.

### Key modules

| Path | Role |
|---|---|
| `app/core/dependencies.py` | `get_current_user` FastAPI dep — verifies Firebase token → returns `User` |
| `app/services/firebase_admin.py` | `verify_firebase_token` — used by both HTTP and WebSocket auth |
| `app/services/gemini.py` | `call_gemini`, `build_prompt`, `validate_generated_code`, `SYSTEM_PROMPT` |
| `app/services/crypto.py` | Fernet encrypt/decrypt for stored Gemini API keys |
| `app/workers/generation_task.py` | Core Celery task; publishes Redis pubsub events |
| `app/websocket/ws_handler.py` | WebSocket endpoint; subscribes to Redis pubsub and relays to client |

### Data model

`User` → `UserApiKey` (one encrypted Gemini key per user)  
`User` → `Project[]` → `ChatSession` (1:1) → `Message[]`  
`Project` → `ProjectVersion[]` → `GeneratedFile[]`  

Each generation creates a new `ProjectVersion`. Only one version has `is_latest=True` at a time. Restoring a version clones its files into a new version.

## Frontend

### Running locally

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

### Environment variables

Create `frontend/.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=uiwiz-de3fa
```

### Routing

Uses Next.js App Router with two route groups:
- `(auth)` — `/login` (unauthenticated)
- `(app)` — `/dashboard`, `/project/[id]`, `/onboarding`, `/settings` (protected via layout)

### State management

Three Zustand stores:
- `authStore` — current Firebase user + DB user record
- `chatStore` — messages, `isGenerating`, `streamingStatus`
- `projectStore` — project list, active project, versions, live file tree (`files`)

`files` in `projectStore` is the source of truth for what Sandpack renders. It's updated when a `files` WebSocket event arrives.

### API communication

- HTTP: `src/lib/api.ts` — axios instance with Firebase ID token injected via interceptor
- WebSocket: `src/hooks/useWebSocket.ts` — manages connection lifecycle; handles all WS event types and dispatches to Zustand stores

### UI preview

`src/components/preview/SandpackWrapper.tsx` renders generated files using `@codesandbox/sandpack-react`. Sandpack runs the Next.js project in-browser.

## Running everything with Docker

```bash
docker compose up --build
```

Services: `postgres:5432`, `redis:6379`, `backend:8000`, `celery_worker`, `frontend:3000`.

Note: the Celery service mounts `firebase-service-account.json` from `backend/` — that file must exist before starting.
