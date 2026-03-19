## Goal
Add error logging to promote visibility at all levels of the stack. All API requests should have some sort of error handling that not only logs in the console, but also is stored somewhere for review later.

## Implementation

### Logger (`lib/logger.ts`)
- Custom logger with `info`, `warn`, `error` methods
- Every call writes to both `console[level]` and the `error_log` SQLite table
- DB write is wrapped in its own try/catch — a logging failure never crashes the app
- `serializeError(e)` helper extracts message/name/stack from caught values

### Database (`lib/migrations/004_create_error_log.sql`)
- `error_log` table: id, level, message, source, code, metadata (JSON), created_at
- Query logs: `sqlite3 crafterhours.db "SELECT * FROM error_log ORDER BY created_at DESC LIMIT 20"`

### API routes — all wrapped with try/catch + logger
- `api/plan/start` — logs on session start failure
- `api/plan/message` — logs stream errors + session lookup failures
- `api/plan/confirm` — logs on plan confirmation failure
- `api/plan/abandon` — logs on abandon failure
- `api/plan/session` — logs on session lookup failure
- `api/recommend` — logs on recommendation failure
- `api/hobbies`, `api/session`, `api/artifact` — info-level log when unimplemented stubs are hit

Error response format (unchanged): `{ error: "message", code: "SCREAMING_SNAKE" }` with 500 status.

### Frontend error surfacing
- `useSession` hook: `error` + `clearError` state, set on recommendation/planning/confirm failures
- `useStreamingChat` hook: `error` + `clearError` state, set on stream failures (ignores user-initiated aborts)
- `app/page.tsx`: inline dismissable error banner rendered when either hook has an active error

### Next.js error boundaries
- `app/error.tsx` — catches unhandled rendering errors, shows retry button
- `app/not-found.tsx` — 404 page with link back to session

## What's not included (by design)
- No log viewer page — SQLite CLI is sufficient for a single-user local app
- No client-side error persistence to DB — browser console covers client errors
- No retry logic in API routes — errors surface to the user who decides
- No new packages — custom logger uses existing better-sqlite3
