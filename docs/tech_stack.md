# UIWiz — Tech Stack

## Frontend

| Technology | Version | Purpose | Why Chosen |
|---|---|---|---|
| Next.js | 14 (App Router) | Frontend framework | File-based routing, SSR, API routes, TypeScript native |
| TypeScript | 5.x | Type safety | Catch errors at compile time, better DX |
| Tailwind CSS | 3.x | Utility-first styling | Rapid iteration, consistent design tokens |
| shadcn/ui | Latest | Component library | Accessible, unstyled base, Tailwind-compatible |
| Framer Motion | 11.x | Animations | Production-grade motion, simple API |
| Zustand | 4.x | Client state | Minimal, no boilerplate, no Provider needed |
| TanStack Query | 5.x | Server state | Caching, refetching, loading states |
| Sandpack | 2.x | Live code preview | Browser-based Next.js sandbox, safe, no server |
| Firebase SDK | 10.x | Auth (client) | Google OAuth, token management |
| Axios | 1.x | HTTP client | Interceptors for auth token injection |

### Why Next.js App Router?
- Layouts shared across pages without re-render
- Server Components reduce client bundle size
- Built-in TypeScript, ESLint, path aliases

### Why Zustand over Redux/Context?
- Zero boilerplate
- No Provider wrapping
- Devtools support
- Tiny bundle (1.5KB)

### Why Sandpack?
- Runs Next.js entirely in the browser
- No server-side code execution needed
- Safe iframe sandboxing
- Exact shape needed: `{ files: { "path": "content" } }`
- CodeSandbox-backed, battle-tested

---

## Backend

| Technology | Version | Purpose | Why Chosen |
|---|---|---|---|
| FastAPI | 0.111.x | API framework | Async native, auto OpenAPI docs, Pydantic |
| Python | 3.12 | Runtime | Stable, rich AI/ML ecosystem |
| SQLAlchemy | 2.x | ORM | Async support, type-safe queries |
| asyncpg | 0.29.x | PostgreSQL driver | Fastest async Postgres driver |
| Alembic | 1.x | DB migrations | SQLAlchemy-native, version-controlled schema |
| Pydantic | 2.x | Validation | Auto-validates request/response, FastAPI native |
| Redis | 7.x | Message broker | Fast, Celery-compatible, pub/sub |
| Celery | 5.x | Task queue | Async AI generation jobs, retries, monitoring |
| google-generativeai | Latest | Gemini SDK | Official Google SDK for Gemini API |
| firebase-admin | 6.x | Token verification | Server-side Firebase JWT verification |
| cryptography | 42.x | Fernet AES-256 | Encrypt Gemini keys at rest |
| python-multipart | Latest | File uploads | FastAPI form handling |
| uvicorn | Latest | ASGI server | Production-grade async server |

### Why FastAPI over Django/Flask?
- Native async/await support (crucial for streaming)
- Auto-generated OpenAPI/Swagger docs
- Pydantic validation built-in
- WebSocket support native
- 2-3x faster than Flask for async workloads

### Why Celery + Redis?
- Gemini generation can take 10-60 seconds
- Cannot block FastAPI request workers
- Celery handles retries, timeouts, monitoring (Flower)
- Redis doubles as cache layer later

### Why SQLAlchemy 2.x async?
- True async queries with asyncpg
- No blocking I/O during DB operations
- Works with FastAPI's async event loop

---

## Database

| Technology | Purpose | Why Chosen |
|---|---|---|
| PostgreSQL 16 | Primary database | Relational integrity, JSONB, ACID |
| Redis 7 | Cache + Celery broker | Fast, ephemeral, pub/sub |

### Why PostgreSQL over MongoDB?
- Data is highly relational (users → projects → chats → messages → versions → files)
- JSONB columns give MongoDB-like flexibility where needed (file trees, dependencies)
- ACID transactions for version snapshots (either all files save or none)
- Complex queries for version history, chat history
- Better tooling (pgAdmin, Alembic migrations)
- Single DB to manage instead of two

### JSONB Usage
`generated_files.content` for small files, file metadata stored as JSONB for fast retrieval without joins.

---

## Authentication

| Technology | Purpose |
|---|---|
| Firebase Authentication | Google OAuth, JWT token issuance |
| Firebase Admin SDK (backend) | Server-side token verification |

### Flow
1. Client: Firebase Google Sign-In popup → returns `id_token`
2. Client: Sends `Authorization: Bearer {id_token}` on every request
3. Backend: `firebase_admin.auth().verify_id_token(token)` → gets `uid`
4. Backend: Looks up or creates user by `firebase_uid`

### Why Firebase-only?
- No password storage or hashing needed
- Google handles MFA, account recovery, security
- Token auto-refreshes on client
- Free for our scale

---

## AI

| Technology | Purpose |
|---|---|
| Google Gemini 1.5 Pro | Code generation |
| User's own API key | Cost — user pays, not us |

### Why User's Own Key?
- Zero inference cost for the platform
- User controls their quota
- No billing integration needed at MVP
- Users already familiar with Gemini Studio

### Generation Strategy
- Structured JSON output via system prompt
- Full conversation history sent each time (context window)
- Gemini 1.5 Pro has 1M token context — handles large codebases

---

## Config

| Location | Format | Contains |
|---|---|---|
| `frontend/.env` | `.env` | Firebase public config, backend URL |
| `backend/config.properties` | Java-style properties | DB URL, Redis URL, secret keys, Firebase project ID |

---

## Infrastructure (MVP)

| Layer | Tech |
|---|---|
| Frontend hosting | Vercel (Next.js native) |
| Backend hosting | Railway / Render / VPS with Docker |
| Database | Supabase (managed Postgres) or self-hosted |
| Redis | Upstash (managed) or self-hosted |
| File storage | PostgreSQL JSONB (MVP), MinIO/S3 (later) |

---

## Tradeoffs & Alternatives Considered

| Decision | Alternative | Reason Chosen |
|---|---|---|
| Celery | FastAPI BackgroundTasks | Celery has retries, monitoring, horizontal scaling |
| PostgreSQL | MongoDB | Relational integrity, JSONB flexibility, single DB |
| Sandpack | Docker runtime | Sandpack needs no infra, safe, instant |
| Zustand | Redux Toolkit | Far less boilerplate, same power for this scale |
| Firebase Auth | Auth.js / Clerk | Firebase is free, handles Google OAuth perfectly |
| Gemini | OpenAI GPT-4 | User brings own key, Gemini is Google-native |
| SSE + WebSocket | Polling | Real-time streaming, far better UX |
