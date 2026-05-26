# UIWiz Deployment Issues — Diagnosis & Resolution

## Architecture Overview

UIWiz is a full-stack AI UI generator with the following architecture:

```
Browser (Next.js frontend)
    │
    │  HTTP / WebSocket
    ▼
FastAPI backend (port 8002 on host)
    │
    ├── PostgreSQL (SQLAlchemy async via asyncpg)
    ├── Redis (pubsub broker + Celery result backend)
    └── Celery worker (sync, uses psycopg2)
              │
              └── Gemini API
```

All services run in Docker Compose. The frontend is a Next.js 14 app (App Router) built into a standalone image. `NEXT_PUBLIC_*` environment variables are compiled into the JS bundle at **build time**, not read at runtime.

---

## Issue 1 — Frontend Hitting `localhost:8001` on the Deployed Server

### Symptom

Every API call from the browser was going to `http://localhost:8001/auth/verify` (visible in the Network tab) instead of `https://api.uiwiz.live/auth/verify`. Requests failed immediately because there is no server at `localhost` from the user's browser.

### Root Cause

`NEXT_PUBLIC_BACKEND_URL` and `NEXT_PUBLIC_WS_URL` are Next.js public environment variables. Next.js compiles these values directly into the JavaScript bundle during `npm run build` — they are **not** read from the environment at container startup. The `docker-compose.yml` passes them as Docker build args:

```yaml
args:
  NEXT_PUBLIC_BACKEND_URL: ${NEXT_PUBLIC_BACKEND_URL}
  NEXT_PUBLIC_WS_URL: ${NEXT_PUBLIC_WS_URL}
```

When the frontend image was rebuilt on the server, Docker reused the cached `builder` stage (because source files had not changed), so the old `localhost:8001` values baked into the previous build were served instead of the updated `.env` values.

### Fix

Force a full rebuild of the frontend image without Docker's layer cache:

```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

**Verification step before rebuilding:**

```bash
docker compose config | grep NEXT_PUBLIC
```

This prints the resolved values Docker Compose will pass as build args, confirming the `.env` file is correct before spending time on a rebuild.

---

## Issue 2 — 401 Unauthorized on `/auth/verify`

### Symptom

After fixing the URL, the frontend successfully reached `https://api.uiwiz.live/auth/verify` but received a `401 Unauthorized` response on every sign-in attempt.

### Root Cause

The auth endpoint swallowed the real exception without logging it:

```python
# app/api/auth.py — original
try:
    token_data = verify_firebase_token(body.id_token)
except Exception as e:
    raise HTTPException(status_code=401, detail="Invalid Firebase token")
```

The variable `e` was never logged, so the backend logs only showed `401 Unauthorized` with no further context. The underlying cause was therefore invisible from the outside.

Most likely root causes (in order of probability):
1. `firebase-service-account.json` missing or not mounted correctly in the container.
2. The service account belongs to a different Firebase project than the one the frontend uses.
3. `credentials_path` in `config.properties` pointing to a wrong path, causing Firebase Admin SDK to fall back to Application Default Credentials (which don't exist in the container), making `auth.verify_id_token()` fail.

### Fix

Added logging so the actual exception is visible in `docker compose logs backend`:

```python
# app/api/auth.py — after fix
import logging
logger = logging.getLogger(__name__)

try:
    token_data = verify_firebase_token(body.id_token)
except Exception as e:
    logger.error("Firebase token verification failed: %s: %s", type(e).__name__, e)
    raise HTTPException(status_code=401, detail="Invalid Firebase token")
```

This exposes the real error (e.g. `TransportError`, `ValueError: invalid project_id`, `CertificateFetchError`) so it can be acted on directly.

---

## Issue 3 — 500 Internal Server Error on `GET /versions/{project_id}`

### Symptom

Opening a project page caused a `500 Internal Server Error` from `GET /versions/{project_id}`. The full traceback:

```
fastapi.exceptions.ResponseValidationError: 1 validation errors:
  {'type': 'get_attribute_error', 'loc': ('response', 0, 'files'),
   'msg': "Error extracting attribute: MissingGreenlet: greenlet_spawn has not
           been called; can't call await_only() here."}
```

Simultaneously, `GET /versions/{project_id}/latest` always returned `404 Not Found`.

### Root Cause — Two Separate Bugs

#### Bug A: Missing eager load (caused the 500)

The `list_versions` endpoint queried `ProjectVersion` rows without eagerly loading the `files` relationship:

```python
# original — no selectinload
result = await db.execute(
    select(ProjectVersion)
    .where(ProjectVersion.project_id == project_id)
    .order_by(ProjectVersion.version_number.desc())
)
return result.scalars().all()
```

The `VersionOut` Pydantic schema includes `files`. When FastAPI serialized the response, Pydantic accessed `version.files` on each object. Because SQLAlchemy async uses a greenlet-based I/O model, accessing a lazy relationship outside the async context (i.e., during Pydantic serialization, which is synchronous) raises `MissingGreenlet`. The relationship must be loaded while still inside the `await db.execute(...)` call.

#### Bug B: Route registration order (caused the 404)

FastAPI matches routes in the order they are registered. The original route order was:

```
GET /{project_id}                    # list versions
GET /{project_id}/{version_id}       # get by ID   ← registered first
GET /{project_id}/latest             # get latest  ← registered second
POST /{project_id}/restore/{version_id}
```

A request to `GET /versions/{project_id}/latest` was matched by `/{project_id}/{version_id}` with `version_id = "latest"`. Since no version has the literal ID `"latest"`, the handler returned 404 every time. The `get_latest_version` function was never actually reachable.

### Fix

**Bug A** — add `selectinload` to `list_versions`:

```python
result = await db.execute(
    select(ProjectVersion)
    .options(selectinload(ProjectVersion.files))   # ← added
    .where(ProjectVersion.project_id == project_id)
    .order_by(ProjectVersion.version_number.desc())
)
```

**Bug B** — move the `/latest` route before the `/{version_id}` route in `app/api/versions.py` and remove the now-duplicate definition at the bottom of the file. Final route order:

```
GET /{project_id}                    # list versions
GET /{project_id}/latest             # get latest  ← now registered first
GET /{project_id}/{version_id}       # get by ID
POST /{project_id}/restore/{version_id}
```

---

## Summary Table

| # | Endpoint | Error | Root Cause | Fix |
|---|----------|-------|------------|-----|
| 1 | All endpoints | Request hits `localhost:8001` | `NEXT_PUBLIC_BACKEND_URL` baked into stale Docker build cache | `docker compose build --no-cache frontend` |
| 2 | `POST /auth/verify` | 401 Unauthorized | Firebase token verification failing silently | Added `logger.error(...)` to expose real exception |
| 3a | `GET /versions/{id}` | 500 MissingGreenlet | `files` relationship lazy-loaded during Pydantic serialization | Added `selectinload(ProjectVersion.files)` to query |
| 3b | `GET /versions/{id}/latest` | 404 Not Found | `/latest` route registered after `/{version_id}`, shadowed by it | Moved `/latest` route above `/{version_id}` |
