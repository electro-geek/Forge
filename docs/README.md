# UIWiz

> AI-powered Next.js UI generator. Describe what you want, see it live, iterate forever.

UIWiz is a Lovable-style full-stack web app generator where users bring their own Gemini API key, chat with an AI to build Next.js UIs, and see them rendered live via Sandpack. Every conversation and generated version is stored permanently.

---

## Features

- **Google Sign-In** via Firebase Authentication
- **Bring Your Own Gemini Key** — you control costs and quota
- **Chat Interface** — describe UIs in plain English
- **Live Preview** — Sandpack renders Next.js code instantly in-browser
- **Version History** — every generation is saved; restore any version
- **Persistent Chat** — all conversations saved forever, revisit anytime
- **File Explorer** — view all generated files like VSCode
- **Streaming Responses** — see generation happen in real-time via WebSocket

---

## Architecture

```
Frontend (Next.js)  ←→  Backend (FastAPI)  ←→  PostgreSQL
                              ↕
                    Redis + Celery Workers
                              ↕
                       Gemini API (user's key)
```

Full architecture in `docs/design.md` and `docs/tech_stack.md`.

---

## Project Structure

```
uiwiz/
├── frontend/          # Next.js 14 App Router
├── backend/           # FastAPI + Celery
└── docs/              # design.md, tech_stack.md, README.md
```

---

## Prerequisites

- Node.js 20+
- Python 3.12+
- PostgreSQL 16
- Redis 7
- A Firebase project (Google Auth enabled)
- A Gemini API key (users provide their own; you need one for testing)

---

## Environment Setup

### Frontend — `frontend/.env`

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Backend — `backend/config.properties`

```properties
[database]
url=postgresql+asyncpg://user:password@localhost:5432/uiwiz

[redis]
url=redis://localhost:6379/0

[firebase]
project_id=your_firebase_project_id
credentials_path=./firebase-service-account.json

[security]
secret_key=your_very_long_random_secret_key_for_aes_encryption
algorithm=HS256

[app]
debug=true
cors_origins=http://localhost:3000
```

---

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Google** sign-in under Authentication → Sign-in method
4. Add your domain to Authorized Domains
5. Copy Firebase config to `frontend/.env`
6. Go to Project Settings → Service Accounts → Generate New Private Key
7. Save as `backend/firebase-service-account.json`

---

## Database Setup

```bash
# Create the database
createdb uiwiz

# Run migrations
cd backend
pip install -r requirements.txt
alembic upgrade head
```

---

## Running Locally

### Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI
uvicorn main:app --reload --port 8000

# In a separate terminal: start Celery worker
celery -A app.workers.celery_app worker --loglevel=info

# In a separate terminal: start Redis (if not running)
redis-server
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Docker Setup (Recommended)

```bash
# From root
docker-compose up --build
```

This starts:
- Frontend on port 3000
- Backend on port 8000
- PostgreSQL on port 5432
- Redis on port 6379
- Celery worker

---

## API Documentation

FastAPI auto-generates docs. With backend running:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/auth/verify` | Verify Firebase token, create/get user |
| POST | `/auth/onboard` | Save encrypted Gemini API key |
| GET | `/projects` | List user's projects |
| POST | `/projects` | Create new project |
| GET | `/projects/{id}` | Get project + latest version files |
| DELETE | `/projects/{id}` | Delete project |
| GET | `/projects/{id}/versions` | Get all versions |
| POST | `/projects/{id}/versions/{v}/restore` | Restore a version |
| GET | `/chats/{project_id}` | Get chat session for project |
| GET | `/chats/{session_id}/messages` | Get all messages |
| POST | `/generate` | Trigger AI generation (queues Celery job) |
| WS | `/ws/{session_id}` | WebSocket for streaming generation |

---

## How Code Generation Works

1. User types prompt → sent via WebSocket
2. Backend verifies Firebase token
3. Backend fetches user's encrypted Gemini key → decrypts in memory
4. Backend loads full chat history + latest file tree
5. Celery worker calls Gemini with structured prompt
6. Gemini returns JSON `{ summary, files }`
7. Backend validates code (security checks)
8. Saves: new message, new `project_version`, `generated_files` rows
9. Streams response back to frontend via WebSocket
10. Frontend injects files into Sandpack → live preview updates

---

## Security Notes

- Gemini API keys are encrypted with AES-256 (Fernet) before storage
- Firebase tokens verified server-side on every request
- Generated code runs only in Sandpack (browser sandbox, no server execution)
- Code validation blocks dangerous patterns before saving

---

## Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel deploy
```
Add all `NEXT_PUBLIC_*` env vars in Vercel dashboard.

### Backend (Railway / Render)
- Set `config.properties` values as environment variables
- Use managed PostgreSQL and Redis add-ons
- Deploy as Docker container using provided `Dockerfile`

---

## Roadmap

- [ ] Phase 1: Auth + Chat + Generation + Sandpack Preview
- [ ] Phase 2: Version history + Restore + File explorer
- [ ] Phase 3: One-click Vercel deploy from UIWiz
- [ ] Phase 4: GitHub sync (push generated code to repo)
- [ ] Phase 5: Multiplayer / shared projects
- [ ] Phase 6: Custom domains + Docker runtime per project
