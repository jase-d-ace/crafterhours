# CrafterHours — Backend

## Session Planning API

### Overview

The planning API powers checkpoints 1–4 of the evening session flow: recommend a hobby, start a planning conversation, exchange messages with Claude to build a session plan, confirm the plan. Five endpoints under `/api/plan/` manage a single active session at a time, backed by a `session_state` table in SQLite. A sixth endpoint, `GET /api/recommend`, provides the initial hobby recommendation.

### Endpoints

#### `GET /api/recommend`

Returns a recommended hobby and the full list of available hobbies. Currently served by mock data (`lib/mocks/recommend.ts`) — the real recommender (`lib/recommender.ts`) is not yet wired up.

Response: `{ recommendation: Recommendation, allHobbies: Hobby[] }`

The `allHobbies` field was added to support the frontend redirect flow without requiring a separate `/api/hobbies` call. When the real recommender is built, this shape should be preserved.

#### `POST /api/plan/start`

Creates a new planning session for a hobby. Calls `abandonActiveSessions()` first to enforce the one-active-session invariant — any existing session with status `'planning'` is moved to `'abandoned'`. Sends the hobby's system prompt to Claude (non-streaming) to generate an opening message, saves it to `session_state.messages`, and returns it to the frontend.

Request: `{ hobbyId: string }`
Response: `{ sessionId: string, hobbyId: string, openingMessage: string }`

#### `POST /api/plan/message`

The main conversational exchange. Appends the user message to the session's message history, then streams Claude's response back as raw text chunks via a `ReadableStream`. The full assistant response is saved to SQLite only after the stream completes — not during.

Request: `{ sessionId: string, message: string }`
Response: raw `text/event-stream` (not SSE `data:` lines — just text chunks)

This is a critical implementation detail: the response is a plain ReadableStream of text, not Server-Sent Events. The frontend reads it with `response.body.getReader()` and a `TextDecoder`, not `EventSource`.

#### `GET /api/plan/session`

Returns the current session state including full message history. Used by the frontend to restore state on page reload.

Query: `?sessionId=uuid`
Response: `{ sessionId, hobbyId, status, messages, sessionPlan }`

#### `POST /api/plan/confirm`

Validates the `SessionPlan` shape (positive durations, at least one structure item, correct types), saves it to `session_state`, and transitions status to `'confirmed'`. Calendar write is stubbed with a `console.log` — not yet implemented.

Request: `{ sessionId: string, sessionPlan: SessionPlan }`
Response: `{ sessionId, status: 'confirmed', sessionPlan }`

#### `POST /api/plan/abandon`

Transitions a planning session to `'abandoned'`. Only valid when status is `'planning'`.

Request: `{ sessionId: string }`
Response: `{ sessionId, status: 'abandoned' }`

### Claude integration (`lib/claude.ts`)

Two functions serve the planning endpoints:

- `getOpeningMessage(hobbyId)` — non-streaming call, returns full assistant response as string. Used by `/api/plan/start`.
- `streamPlanningResponse(messages, hobbyId)` — streaming call, yields raw Anthropic SDK events. Used by `/api/plan/message`.

Both use `claude-sonnet-4-6` with `max_tokens: 1024`. The Anthropic client is initialized at module level and reads `ANTHROPIC_API_KEY` from the environment automatically.

Each of the three initial hobbies has a dedicated system prompt that instructs Claude on tone, coaching approach, and output format. All system prompts end with an instruction to include a fenced ` ```json ` block containing a `SessionPlan` object in the final message — the frontend extracts this to transition from planning to plan confirmation.

### Database layer (`lib/db.ts`)

Session state CRUD functions:

- `createSession(hobbyId)` — inserts a new row, returns `SessionState`
- `getSession(sessionId)` — retrieves by ID, returns `SessionState | null`
- `updateSessionMessages(sessionId, messages)` — overwrites the messages JSON column
- `updateSessionStatus(sessionId, status)` — updates status
- `updateSessionPlan(sessionId, plan)` — saves plan JSON and sets status to `'confirmed'`
- `abandonActiveSessions()` — sets all `status = 'planning'` rows to `'abandoned'`

The `session_state` table stores `messages` and `session_plan` as JSON text columns. The CRUD functions handle JSON serialization/deserialization and map snake_case columns to camelCase TypeScript fields.

### Design decisions

- **One active session at a time.** Starting a new session abandons all existing planning sessions. This keeps the UX simple — the app always has a single "current" session.
- **Raw text streaming, not SSE.** The message endpoint writes raw text chunks to a ReadableStream rather than using SSE framing. Simpler on both sides and avoids the complexity of event parsing.
- **Messages saved after stream completes.** The full assistant response is assembled in memory during streaming and written to SQLite in a single update after the stream closes. This avoids partial writes on disconnection.
- **System prompts embed plan extraction.** Rather than using a separate "extract plan" call, the system prompt instructs Claude to include a JSON code block when the plan is ready. The frontend handles extraction. This keeps the conversation natural — Claude decides when the plan is ready.
- **Mock recommend, real plan routes.** The recommendation endpoint uses mock data because the real recommender depends on calendar and GitHub MCP integrations that aren't built yet. The plan routes use real Claude API calls because they only depend on the Anthropic SDK.

### Technical limitations

- **No session resumability across server restarts.** The frontend doesn't persist `sessionId` — refreshing the page during planning starts over. The `GET /api/plan/session` endpoint exists for future use but isn't called by the frontend yet.
- **No error recovery on stream failure.** If the streaming connection drops mid-response, the partial response is lost. The message is not saved to SQLite (correct behavior), but the frontend has no retry mechanism.
- **Calendar write is stubbed.** `POST /api/plan/confirm` logs a TODO message instead of creating a calendar block. Depends on Google Calendar MCP integration.
- **No rate limiting or request validation beyond shape checks.** Single-user local app — acceptable for now but would need hardening for any multi-user scenario.

### Tests

`app/api/plan/__tests__/plan.test.ts` — 19 tests covering all five endpoints. Mocks the Anthropic SDK and better-sqlite3. Tests cover happy paths, missing fields (400), not found (404), and invalid state transitions (409).
