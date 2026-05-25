# UIWiz — Design Document

## 1. Product Vision

UIWiz is an AI-powered UI generation platform where developers and designers describe what they want in plain English and get fully working Next.js code rendered live in-browser. Users bring their own Gemini API key, eliminating inference costs, and every project and conversation is stored forever.

**Core Promise:** Type what you want → See it live → Iterate → Export.

---

## 2. User Flow

### First-Time User
```
Landing Page → Click "Sign in with Google" → Firebase OAuth
    → Onboarding: Enter Gemini API Key → Key encrypted + saved
    → Redirect to Dashboard
```

### Returning User
```
Login → Firebase token verified → Dashboard
    → Create New Project OR Open Existing Project
```

### Core Generation Loop
```
/project/[id]
    → User types prompt in Chat Panel
    → Message sent to backend via WebSocket
    → Backend calls Gemini with user's key + full history
    → Streamed response arrives
    → Chat panel shows explanation text
    → File tree injected into Sandpack
    → Live preview updates in real-time
    → Version snapshot saved automatically
```

### Iteration Loop
```
User sees preview → Types refinement prompt
    → Backend loads latest version files + history
    → Gemini modifies existing code
    → New version saved (v1, v2, v3...)
    → User can click any version to restore
```

---

## 3. UI Layout

### Login Page (`/login`)
- Full-screen centered layout
- UIWiz logo + tagline
- "Sign in with Google" button (Firebase popup)
- Background: animated gradient mesh

### Onboarding (`/onboarding`)
- Single step: Gemini API key input
- Instructions on how to get a key
- Key masked input with show/hide toggle
- Encrypted before sending to backend

### Dashboard (`/dashboard`)
- Left sidebar: project list
- Main area: project cards grid
- Top bar: user avatar, settings link
- "New Project" button (creates project + opens /project/[id])

### Project Editor (`/project/[id]`) — 3-Panel Layout
```
┌──────────────┬──────────────────────────┬─────────────┐
│              │                          │             │
│  Chat Panel  │    Live Preview          │  Version    │
│  (left 30%)  │    (Sandpack) (center    │  Sidebar    │
│              │    50%)                  │  (right     │
│  Messages    │                          │  20%)       │
│  + Input     │    File Explorer tab     │  v1,v2,v3   │
│              │    Code tab              │             │
└──────────────┴──────────────────────────┴─────────────┘
```

### Settings (`/settings`)
- Update Gemini API key
- Account info (from Firebase)
- Danger zone: delete account

---

## 4. State Management (Zustand)

### authStore
```ts
{
  user: FirebaseUser | null,
  idToken: string | null,
  isOnboarded: boolean,
  login: () => void,
  logout: () => void,
  setToken: (token: string) => void
}
```

### projectStore
```ts
{
  projects: Project[],
  activeProject: Project | null,
  activeVersion: ProjectVersion | null,
  versions: ProjectVersion[],
  files: Record<string, string>,       // current file tree
  setFiles: (files) => void,
  setActiveVersion: (v) => void
}
```

### chatStore
```ts
{
  sessions: ChatSession[],
  activeSession: ChatSession | null,
  messages: Message[],
  isGenerating: boolean,
  streamingText: string,
  sendMessage: (prompt: string) => void
}
```

---

## 5. Component Responsibilities

| Component | Responsibility |
|---|---|
| `ChatPanel` | Renders message history, handles input, triggers generation |
| `ChatMessage` | Renders a single user or assistant message with markdown |
| `StreamingText` | Animates streamed text token by token |
| `SandpackWrapper` | Wraps Sandpack, injects files, handles template |
| `FileExplorer` | VSCode-like tree view of generated files |
| `VersionSidebar` | Lists all versions, click to restore |
| `Topbar` | Project name, export button, user menu |
| `Sidebar` | Project list navigation |
| `ProjectLayout` | 3-panel resizable layout for /project/[id] |

---

## 6. Realtime Architecture

### WebSocket Flow
```
Frontend opens WS connection: ws://backend/ws/{session_id}?token={firebase_token}
    → Backend authenticates token on connect
    → User sends: { type: "generate", prompt: "..." }
    → Backend starts Celery task
    → Worker streams back:
        { type: "text_chunk", content: "..." }     ← explanation tokens
        { type: "files", content: { ... } }         ← final file tree
        { type: "done", version: 3 }                ← generation complete
    → Frontend updates UI progressively
```

### SSE Fallback
If WebSocket is unavailable, fall back to Server-Sent Events on `POST /generate`.

---

## 7. Security Design

### Gemini Key Security
- Never stored in plaintext
- Encrypted with AES-256 (Fernet) using `SECRET_KEY` from `config.properties`
- Decrypted only at request time in memory
- Never returned to frontend in any response
- Never logged

### Code Safety
- All generated code runs ONLY in Sandpack (browser sandbox)
- Backend validates generated code before saving:
  - No `child_process` imports
  - No `fs` module usage
  - No `eval()` or `Function()` calls
  - No `process.env` access with sensitive patterns
- Sandpack provides iframe sandboxing (no server execution)

### Auth Security
- Every API request requires `Authorization: Bearer {firebase_id_token}` header
- Backend verifies token with Firebase Admin SDK on every request
- No session cookies — stateless JWT verification

### Prompt Injection
- System prompt clearly instructs Gemini to only return JSON with code
- User prompt is sanitized before being appended to history

---

## 8. Versioning Strategy

Every AI generation creates an immutable version snapshot:

```
project_versions table:
  id, project_id, version_number, prompt, created_at

generated_files table:
  id, version_id, file_path, content, language
```

- `version_number` increments per project (1, 2, 3...)
- Restoring a version creates a NEW version (non-destructive)
- Frontend version sidebar shows: version number, timestamp, prompt preview
- "Latest" badge on most recent version
- Click any version → files loaded from DB → injected into Sandpack

---

## 9. AI Workflow

### System Prompt (sent to Gemini every time)
```
You are an expert Next.js developer. Generate complete, working Next.js code.
Always respond with ONLY valid JSON in this exact format:
{
  "summary": "Brief explanation of what you built/changed",
  "files": {
    "app/page.tsx": "...",
    "components/Hero.tsx": "..."
  }
}
Do not include markdown code blocks. Return raw JSON only.
```

### Context Building
Each generation sends to Gemini:
1. System prompt (above)
2. Full chat history (all prior user + assistant messages)
3. Current file tree (from latest version)
4. New user prompt

This gives Gemini full context to make incremental changes correctly.

---

## 10. Scaling Strategy

### MVP (Now)
- Single FastAPI instance
- Single PostgreSQL database
- Redis + Celery for async jobs
- Files stored as text in PostgreSQL (JSONB)

### Phase 2
- Add MinIO/S3 for zipped project exports
- Add read replicas for PostgreSQL
- Horizontal Celery worker scaling

### Phase 3
- Docker containers per generation (isolated execution)
- One-click Vercel/Netlify deployment
- GitHub sync (push generated code to repo)
- Multiplayer (shared project editing)
