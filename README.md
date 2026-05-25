# UIWiz — AI UI Generator

UIWiz turns plain-English descriptions into production-ready **Next.js + Tailwind CSS** components, rendered live in the browser. Users bring their own [Gemini API key](https://aistudio.google.com/app/apikey) — no subscriptions, no usage limits imposed by the platform.

---

## Table of Contents

- [How it works](#how-it-works)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Quick start (Docker)](#quick-start-docker)
- [Manual setup](#manual-setup)
  - [Backend](#backend-setup)
  - [Frontend](#frontend-setup)
- [Configuration](#configuration)
  - [Backend — config.properties](#backend--configproperties)
  - [Frontend — .env.local](#frontend--envlocal)
- [Database migrations](#database-migrations)
- [API reference](#api-reference)
- [WebSocket protocol](#websocket-protocol)
- [Data model](#data-model)
- [Running tests](#running-tests)
- [Deployment notes](#deployment-notes)

---

## How it works

1. User signs in with Google (Firebase Auth).
2. User adds their Gemini API key in Settings — stored encrypted at rest (Fernet/AES-128).
3. User creates a project and opens a chat session.
4. User types a UI description (e.g. *"Build me a pricing page with a monthly/yearly toggle"*).
5. The browser opens a **WebSocket** to the backend.
6. The backend enqueues a **Celery task** that calls Gemini, saves a new `ProjectVersion` + `GeneratedFile` rows, and publishes events to a **Redis pub/sub** channel.
7. The WebSocket handler relays `status → files → done` events back to the client.
8. The frontend updates **Zustand** stores; **Sandpack** re-renders the live preview instantly.
9. Every generation is versioned — users can browse history and restore any prior version.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser                                                             │
│  Next.js 14 (App Router)                                            │
│  Zustand stores · Sandpack live preview · Firebase Auth SDK         │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  HTTP (axios + Firebase ID token)
                           │  WebSocket (/ws/{session_id}?token=…)
┌──────────────────────────▼──────────────────────────────────────────┐
│  FastAPI  (:8000)                                                    │
│  auth · projects · chats · generate · versions · keys · /ws        │
└────────────┬────────────────────────────────┬───────────────────────┘
             │  Celery task (enqueue)          │  async SQLAlchemy
             │                                │  (asyncpg)
┌────────────▼────────────┐       ┌───────────▼───────────────────────┐
│  Redis (:6379)           │       │  PostgreSQL (:5432)               │
│  broker · result backend │       │  users · projects · versions      │
│  pub/sub channel         │       │  files · chat sessions · messages │
└────────────┬────────────┘       └───────────────────────────────────┘
             │  subscribe
┌────────────▼────────────┐
│  Celery worker           │
│  calls Gemini API        │
│  saves DB rows           │
│  publishes WS events     │
└─────────────────────────┘
```

> **Async/sync duality:** The FastAPI app uses `asyncpg` (async SQLAlchemy). The Celery worker is synchronous and uses `psycopg2`; it converts the database URL at runtime (`postgresql+asyncpg → postgresql+psycopg2`).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 14 (App Router) |
| Frontend language | TypeScript |
| Styling | Tailwind CSS |
| UI primitives | Radix UI, shadcn/ui |
| Animations | Framer Motion |
| State management | Zustand |
| In-browser preview | Sandpack (CodeSandbox) |
| Auth (client) | Firebase Auth SDK |
| HTTP client | Axios |
| Backend framework | FastAPI 0.111 |
| Backend language | Python 3.10+ |
| ORM | SQLAlchemy 2.0 (async) |
| DB driver (API) | asyncpg |
| DB driver (worker) | psycopg2-binary |
| Task queue | Celery 5 |
| Message broker | Redis 7 |
| Auth (server) | Firebase Admin SDK |
| AI model | Google Gemini (`google-generativeai`) |
| Encryption | Cryptography (Fernet) |
| Migrations | Alembic |
| Database | PostgreSQL 16 |
| Containerisation | Docker + Docker Compose |

---

## Project structure

```
uiwiz/
├── docker-compose.yml          # Full-stack compose file
├── .gitignore
├── README.md
│
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── config.properties       # ← NOT committed (see .gitignore)
│   ├── firebase-service-account.json  # ← NOT committed
│   │
│   └── app/
│       ├── api/                # Route handlers
│       │   ├── auth.py         # POST /auth/verify-token
│       │   ├── projects.py     # CRUD /projects
│       │   ├── chats.py        # GET /chats/{project_id}/session+messages
│       │   ├── generate.py     # POST /generate (enqueues Celery task)
│       │   ├── versions.py     # GET/POST /versions
│       │   └── keys.py         # POST/DELETE /keys (Gemini API key)
│       ├── core/
│       │   ├── config.py       # Settings (reads config.properties + env vars)
│       │   └── dependencies.py # get_current_user FastAPI dependency
│       ├── db/
│       │   ├── database.py     # SQLAlchemy engine + session factory
│       │   └── migrations/     # Alembic migration files
│       ├── models/             # SQLAlchemy ORM models
│       ├── schemas/            # Pydantic request/response schemas
│       ├── services/
│       │   ├── firebase_admin.py  # verify_firebase_token
│       │   ├── gemini.py          # call_gemini, build_prompt, SYSTEM_PROMPT
│       │   └── crypto.py          # Fernet encrypt/decrypt for API keys
│       ├── websocket/
│       │   └── ws_handler.py   # /ws/{session_id} — Redis pub/sub relay
│       └── workers/
│           ├── celery_app.py   # Celery configuration
│           └── generation_task.py  # run_generation task
│
├── frontend/
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── Dockerfile
│   ├── .env.local              # ← NOT committed (see .gitignore)
│   │
│   └── src/
│       ├── app/
│       │   ├── layout.tsx      # Root layout + global metadata + fonts
│       │   ├── page.tsx        # Landing page (server component)
│       │   ├── globals.css
│       │   ├── robots.ts       # /robots.txt
│       │   ├── sitemap.ts      # /sitemap.xml
│       │   ├── manifest.ts     # /manifest.json
│       │   ├── opengraph-image.tsx  # Dynamic OG image
│       │   ├── icon.tsx        # Dynamic favicon
│       │   ├── _components/
│       │   │   └── LandingClient.tsx  # Landing page interactive layer
│       │   ├── (auth)/
│       │   │   ├── layout.tsx  # Auth pages metadata
│       │   │   └── login/page.tsx
│       │   └── (app)/          # Protected routes (noindex)
│       │       ├── layout.tsx
│       │       ├── dashboard/page.tsx
│       │       ├── project/[id]/page.tsx
│       │       ├── settings/page.tsx
│       │       └── onboarding/page.tsx
│       ├── components/
│       │   ├── chat/           # ChatPanel, ChatMessage
│       │   ├── layout/         # Topbar
│       │   ├── preview/        # SandpackWrapper
│       │   └── versions/       # VersionSidebar
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   └── useWebSocket.ts
│       ├── lib/
│       │   ├── api.ts          # Axios instance with Firebase token interceptor
│       │   ├── firebase.ts     # Firebase client initialisation
│       │   └── utils.ts
│       ├── store/
│       │   ├── authStore.ts    # Firebase user + DB user
│       │   ├── chatStore.ts    # Messages, streaming status
│       │   └── projectStore.ts # Projects, versions, live file tree
│       └── types/index.ts
│
└── docs/
```

---

## Quick start (Docker)

The fastest way to run everything locally.

**Prerequisites:** Docker Desktop (or Docker Engine + Compose plugin).

```bash
# 1. Clone the repo
git clone <repo-url>
cd uiwiz

# 2. Add the Firebase service account key
cp /path/to/your-firebase-adminsdk.json backend/firebase-service-account.json

# 3. Create the backend config
cp backend/config.properties.example backend/config.properties
# → edit config.properties with your values (see Configuration section)

# 4. Create the frontend env file
cp frontend/.env.local.example frontend/.env.local
# → edit .env.local with your Firebase client config

# 5. Start everything
docker compose up --build
```

Services started:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## Manual setup

### Backend setup

**Prerequisites:** Python 3.10+, PostgreSQL 16, Redis 7.

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start infrastructure (if not using Docker)
docker compose up postgres redis -d

# Create config file
cp config.properties.example config.properties
# Edit config.properties — see Configuration section below

# Run database migrations
alembic upgrade head

# Start the API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Start the Celery worker (separate terminal, venv activated)
celery -A app.workers.celery_app worker --loglevel=info --concurrency=4
```

### Frontend setup

**Prerequisites:** Node.js 18+.

```bash
cd frontend

# Install dependencies
npm install

# Create env file
cp .env.local.example .env.local
# Edit .env.local — see Configuration section below

# Start dev server
npm run dev       # http://localhost:3000

# Other commands
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # ESLint
```

---

## Configuration

### Backend — `config.properties`

Create `backend/config.properties` (this file is gitignored):

```ini
[database]
url = postgresql+asyncpg://postgres:password@localhost:5432/uiwiz
pool_size = 10

[redis]
url = redis://localhost:6379/0
celery_broker = redis://localhost:6379/0
celery_backend = redis://localhost:6379/1

[firebase]
project_id = your-firebase-project-id
credentials_path = ./firebase-service-account.json

[security]
# Must be a strong random string — used to derive the Fernet key
# that encrypts stored Gemini API keys. Changing this invalidates
# all existing encrypted keys.
secret_key = your-secret-key-min-32-chars

[app]
debug = false
cors_origins = http://localhost:3000
```

All values fall back to environment variables if the file is absent, making Docker deployments straightforward.

### Frontend — `.env.local`

Create `frontend/.env.local` (gitignored):

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Firebase project config (from Firebase console → Project settings → Your apps)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# Optional: canonical URL for SEO (sitemap, OG tags)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

## Database migrations

Migrations live in `backend/app/db/migrations/`. Alembic is the canonical migration tool; the app also calls `Base.metadata.create_all` on startup as a dev convenience.

```bash
cd backend

# Apply all pending migrations
alembic upgrade head

# Create a new migration after changing a model
alembic revision --autogenerate -m "describe your change"

# Roll back one migration
alembic downgrade -1

# Show current revision
alembic current
```

---

## API reference

Full interactive docs are available at `http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc` when the server is running.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Health check |
| `POST` | `/auth/verify-token` | Firebase token | Verify token, create user on first login |
| `POST` | `/keys` | ✓ | Save (encrypted) Gemini API key |
| `DELETE` | `/keys` | ✓ | Remove stored Gemini API key |
| `GET` | `/projects` | ✓ | List all projects for the current user |
| `POST` | `/projects` | ✓ | Create a new project |
| `GET` | `/projects/{id}` | ✓ | Get a single project |
| `DELETE` | `/projects/{id}` | ✓ | Delete a project |
| `GET` | `/chats/{project_id}/session` | ✓ | Get or create the chat session for a project |
| `GET` | `/chats/{session_id}/messages` | ✓ | List all messages in a session |
| `POST` | `/generate` | ✓ | Enqueue a UI generation task |
| `GET` | `/versions/{project_id}` | ✓ | List all versions for a project |
| `GET` | `/versions/{project_id}/latest` | ✓ | Get the latest version with all files |
| `GET` | `/versions/{version_id}/files` | ✓ | Get files for a specific version |
| `POST` | `/versions/{version_id}/restore` | ✓ | Clone a version as a new latest version |
| `WS` | `/ws/{session_id}?token=…` | Firebase token | Real-time generation stream |

All authenticated endpoints expect a Firebase ID token in the `Authorization: Bearer <token>` header.

---

## WebSocket protocol

Connect to `/ws/{session_id}?token={firebase_id_token}`.

**Client → server:**

```json
{ "type": "generate", "prompt": "Build me a hero section with a gradient background" }
```

**Server → client (sequence):**

```jsonc
{ "type": "status", "message": "Starting generation…" }
{ "type": "status", "message": "Calling Gemini…" }
{
  "type": "files",
  "files": {
    "/app/page.tsx": "\"use client\";\n…",
    "/components/Hero.tsx": "…"
  },
  "version_number": 3
}
{ "type": "done", "version_id": "abc-123" }

// On error:
{ "type": "error", "message": "Gemini API key not found" }
```

---

## Data model

```
User
 ├── UserApiKey          (1:1) — Fernet-encrypted Gemini key
 └── Project[]
      ├── ChatSession    (1:1 per project)
      │    └── Message[]
      └── ProjectVersion[]
           └── GeneratedFile[]
```

- Only one `ProjectVersion` has `is_latest = true` at a time.
- Restoring a version clones its `GeneratedFile` rows into a new `ProjectVersion`.
- Messages store role (`user` / `assistant`) and the raw prompt/response.

---

## Running tests

```bash
cd backend

# Run all tests
pytest tests/test_api.py -v

# Run a single test
pytest tests/test_api.py::test_health -v

# With coverage report
pytest tests/ --cov=app --cov-report=term-missing
```

---

## Deployment notes

- **Environment variables** take precedence over `config.properties`, so in production just set env vars — no config file needed.
- The `secret_key` in `[security]` derives the Fernet encryption key for stored Gemini API keys. **Do not change it after launch** — rotating it requires re-encrypting all stored keys.
- The Celery worker and the API server both need access to the same PostgreSQL and Redis instances.
- The frontend can be deployed to Vercel or any Node-compatible host; set the `NEXT_PUBLIC_*` env vars in your hosting dashboard.
- For the WebSocket to work behind a reverse proxy (nginx, Caddy), ensure the proxy is configured to pass `Upgrade: websocket` headers.
- Docker volume names are `postgres_data` and `redis_data` — back them up before destructive operations.
