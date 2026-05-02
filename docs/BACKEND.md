# CrafterHours — Backend

## Session & Artifact API

### Overview

The backend API powers the full evening session flow (checkpoints 1–7): recommend a hobby, start a planning conversation, exchange messages with Claude to build a session plan, confirm the plan, save the completed session, generate an artifact, and persist it. Ten endpoints across four groups manage the lifecycle, backed by SQLite via better-sqlite3. A mock recommendation endpoint provides the initial hobby suggestion.

### Endpoints

#### `GET /api/recommend`

Returns a recommended hobby and the full list of available hobbies. Currently served by mock data (`lib/mocks/recommend.ts`) — the real recommender (`lib/recommender.ts`) is not yet wired up.

Response: `{ recommendation: Recommendation, allHobbies: Hobby[] }`

The `allHobbies` field supports the frontend redirect flow without requiring a separate `/api/hobbies` call. When the real recommender is built, this shape should be preserved.

#### `POST /api/plan/start`

Creates a new planning session for a hobby. Validates the hobby exists via `getHobbyById()`. Calls `abandonActiveSessions()` first to enforce the one-active-session invariant — any existing session with status `'planning'` is moved to `'abandoned'`. Sends the hobby's system prompt to Claude (non-streaming) to generate an opening message, saves it to `session_state.messages`, and returns it to the frontend.

Request: `{ hobbyId: string }`
Response: `{ sessionId: string, hobbyId: string, openingMessage: string }`

#### `POST /api/plan/message`

The main conversational exchange. Appends the user message to the session's message history, then streams Claude's response back as raw text chunks via a `ReadableStream`. The full assistant response is saved to SQLite only after the stream completes — not during. Validates session exists and status is `'planning'`.

Request: `{ sessionId: string, message: string }`
Response: raw `text/event-stream` (not SSE `data:` lines — just text chunks)

This is a critical implementation detail: the response is a plain ReadableStream of text, not Server-Sent Events. The frontend reads it with `response.body.getReader()` and a `TextDecoder`, not `EventSource`.

#### `GET /api/plan/session`

Returns the current session state including full message history. Used by the frontend to restore state on page reload (not yet wired up on the frontend).

Query: `?sessionId=uuid`
Response: `{ sessionId, hobbyId, status, messages, sessionPlan }`

#### `POST /api/plan/confirm`

Validates the `SessionPlan` shape (positive durations, at least one structure item, correct phase types from the set warmup/main/cooldown/reflection), saves it to `session_state`, and transitions status to `'confirmed'`. Calendar write is stubbed with a `console.log` — not yet implemented.

Request: `{ sessionId: string, sessionPlan: SessionPlan }`
Response: `{ sessionId, status: 'confirmed', sessionPlan }`

#### `POST /api/plan/abandon`

Transitions a planning session to `'abandoned'`. Only valid when status is `'planning'`.

Request: `{ sessionId: string }`
Response: `{ sessionId, status: 'abandoned' }`

#### `GET /api/session`

Returns recent completed sessions (default limit 10, most recent first).

Response: `{ sessions: Session[] }`

#### `POST /api/session`

Saves a completed session after the user finishes and logs notes. Validates the referenced session state exists and has status `'confirmed'`. Rounds `actualDuration` to the nearest minute (minimum 1). Maps artifact type from hobby ID using a hardcoded mapping (hobby_guitar → practice_log, hobby_writing → journal, hobby_building → coding_summary).

Request: `{ sessionId: string, actualDuration: number, notes: string, artifactType: string }`
Response: `{ session: Session }`

#### `POST /api/artifact`

Streams a generated artifact (markdown) for the user to preview before saving. Fetches the session state (must have a session plan) and the hobby definition, then calls `streamArtifactGeneration()` with hobby-specific artifact prompts. The user message sent to Claude includes the session plan JSON and the user's notes about how the session went.

Request: `{ sessionId: string, notes: string, hobbyId: string }`
Response: raw `text/event-stream` (same streaming pattern as `/api/plan/message`)

#### `POST /api/artifact/save`

Persists the final artifact content to the `artifacts` table. Validates the artifact type is one of: journal, practice_log, coding_summary.

Request: `{ dbSessionId: string, hobbyId: string, type: string, content: string }`
Response: `{ artifact: Artifact }`

#### `GET /api/hobbies` and `POST /api/hobbies`

Both return 501 Not Implemented. Placeholder for future hobby CRUD via the settings page.

### Claude integration (`lib/claude.ts`)

Four functions serve the endpoints:

- `getOpeningMessage(hobbyId)` — non-streaming call, returns full assistant response as string. Used by `/api/plan/start`.
- `streamPlanningResponse(messages, hobbyId)` — streaming call, yields raw Anthropic SDK events. Used by `/api/plan/message`.
- `streamArtifactGeneration(notes, plan, hobbyId)` — streaming call with hobby-specific artifact prompts. The user message includes the session plan JSON and the user's session notes. Used by `/api/artifact`.
- `getSystemPrompt(hobbyId)` — returns the hobby-specific system prompt for planning. Throws if the hobby ID is unknown.

All use `claude-sonnet-4-6` with `max_tokens: 1024`. The Anthropic client is initialized at module level and reads `ANTHROPIC_API_KEY` from the environment automatically.

#### System prompts (planning)

Each of the three initial hobbies has a dedicated system prompt that instructs Claude on tone, coaching approach, and output format. All system prompts end with an instruction to include a fenced ` ```json ` block containing a `SessionPlan` object in the final message — the frontend extracts this to transition from planning to plan confirmation.

#### Artifact prompts

Separate from planning prompts. Each hobby has a dedicated artifact prompt:
- **Guitar**: practice log — what was practiced, what clicked, what to revisit next session
- **Writing**: journal entry — preserves user voice, honest reflections
- **Building**: coding summary — what was built, key decisions, blockers, what's next

### Database layer (`lib/db.ts`)

SQLite via `better-sqlite3`. WAL journal mode, foreign keys enforced. Path from `DATABASE_PATH` env var or `./crafterhours.db`.

#### Hobby functions
- `getHobbies()` — returns all active hobbies
- `getHobbyById(hobbyId)` — returns a single hobby or null

#### Session state functions (in-progress planning)
- `createSession(hobbyId)` — inserts a new row, returns `SessionState`
- `getSession(sessionId)` — retrieves by ID, returns `SessionState | null`
- `updateSessionMessages(sessionId, messages)` — overwrites the messages JSON column
- `updateSessionStatus(sessionId, status)` — updates status
- `updateSessionPlan(sessionId, plan)` — saves plan JSON and sets status to `'confirmed'`
- `abandonActiveSessions()` — sets all `status = 'planning'` rows to `'abandoned'`

#### Completed session functions
- `getRecentSessions(limit = 10)` — returns recent completed sessions, most recent first
- `saveSession(data: SaveSessionInput)` — inserts a completed session row, returns `Session`

#### Artifact functions
- `saveArtifact(data: SaveArtifactInput)` — inserts an artifact row, returns `Artifact`

The `session_state` table stores `messages` and `session_plan` as JSON text columns. The CRUD functions handle JSON serialization/deserialization and map snake_case columns to camelCase TypeScript fields via internal `rowTo*()` transformers.

### Database schema

#### `hobbies`
- `id` TEXT PRIMARY KEY
- `name` TEXT NOT NULL
- `emoji` TEXT NOT NULL
- `goal` TEXT NOT NULL
- `focus_areas` TEXT NOT NULL (JSON array)
- `active` INTEGER NOT NULL DEFAULT 1
- `created_at` TEXT NOT NULL DEFAULT (datetime('now'))

#### `sessions` (completed sessions)
- `id` TEXT PRIMARY KEY
- `hobby_id` TEXT NOT NULL REFERENCES hobbies(id)
- `duration` INTEGER NOT NULL (minutes)
- `notes` TEXT NOT NULL DEFAULT ''
- `artifact_type` TEXT NOT NULL
- `created_at` TEXT NOT NULL DEFAULT (datetime('now'))

#### `artifacts`
- `id` TEXT PRIMARY KEY
- `session_id` TEXT NOT NULL REFERENCES sessions(id)
- `hobby_id` TEXT NOT NULL REFERENCES hobbies(id)
- `type` TEXT NOT NULL CHECK (type IN ('journal', 'practice_log', 'coding_summary'))
- `content` TEXT NOT NULL (markdown)
- `created_at` TEXT NOT NULL DEFAULT (datetime('now'))

#### `session_state` (in-progress planning)
- `id` TEXT PRIMARY KEY
- `hobby_id` TEXT NOT NULL REFERENCES hobbies(id)
- `status` TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'abandoned'))
- `messages` TEXT NOT NULL DEFAULT '[]' (JSON array of {role, content})
- `session_plan` TEXT (JSON SessionPlan or NULL)
- `created_at` TEXT NOT NULL DEFAULT (datetime('now'))
- `updated_at` TEXT NOT NULL DEFAULT (datetime('now'))

### Migrations

- `001_initial.sql` — creates hobbies, sessions, artifacts, session_state tables
- `002_seed_hobbies.sql` — seeds the three initial hobbies (Guitar, Writing, Building)
- `003_alter_session_state.sql` — migrates session_state from a generic `state` JSON blob to explicit columns (`status`, `messages`, `session_plan`) via table recreation

### Additional library files

#### `lib/hobbies.ts`
- `getDefaultHobbies()` — returns the three seeded hobbies as in-memory defaults
- `isKnownHobby(hobbyId)` — checks if a hobby ID is one of the three seeded hobbies

#### `lib/mocks/recommend.ts`
- `getMockRecommendation()` — returns a hardcoded recommendation (Guitar at 0.85 confidence, Writing as alternative) with all three hobbies in `allHobbies`

#### `lib/artifactGenerators.ts`
Stub file — three functions (`generateJournal`, `generatePracticeLog`, `generateCodingSummary`) that throw `NotImplementedError`. Artifact generation is now handled by `streamArtifactGeneration()` in `lib/claude.ts` instead.

#### `lib/recommender.ts`
Stub — `buildRecommendation()` throws `NotImplementedError`. Real recommendation logic depends on calendar and GitHub MCP integrations.

#### `lib/github.ts`
Stub — `getRecentCommits()` throws `NotImplementedError`. Defines `CommitInfo` type.

#### `lib/calendar.ts`
Stub — `getTonightContext()` throws `NotImplementedError`. Defines `CalendarContext` and `CalendarEvent` types.

### Design decisions

- **One active session at a time.** Starting a new session abandons all existing planning sessions. This keeps the UX simple — the app always has a single "current" session.
- **Raw text streaming, not SSE.** Both the message and artifact endpoints write raw text chunks to a ReadableStream rather than using SSE framing. Simpler on both sides and avoids the complexity of event parsing.
- **Messages saved after stream completes.** The full assistant response is assembled in memory during streaming and written to SQLite in a single update after the stream closes. This avoids partial writes on disconnection.
- **System prompts embed plan extraction.** Rather than using a separate "extract plan" call, the system prompt instructs Claude to include a JSON code block when the plan is ready. The frontend handles extraction. This keeps the conversation natural — Claude decides when the plan is ready.
- **Separate planning and artifact prompts.** Each hobby has two prompt sets: one for planning conversation coaching, one for artifact generation. The artifact prompt receives the session plan and user notes to produce the right output format.
- **Mock recommend, real everything else.** The recommendation endpoint uses mock data because the real recommender depends on calendar and GitHub MCP integrations. The plan, session, and artifact routes use real Claude API and real database writes.
- **Two session tables.** `session_state` tracks the in-progress planning conversation (ephemeral). `sessions` stores completed sessions (permanent). The artifact links to `sessions`, not `session_state`.
- **Artifact type mapped from hobby ID.** The POST `/api/session` endpoint maps hobby IDs to artifact types (guitar → practice_log, etc.) rather than trusting the frontend to send the correct type. This keeps the mapping authoritative on the server.

### Technical limitations

- **No session resumability across server restarts.** The frontend doesn't persist `sessionId` — refreshing the page during planning starts over. The `GET /api/plan/session` endpoint exists for future use but isn't called by the frontend yet.
- **No error recovery on stream failure.** If the streaming connection drops mid-response, the partial response is lost. The message is not saved to SQLite (correct behavior), but the frontend has no retry mechanism.
- **Calendar write is stubbed.** `POST /api/plan/confirm` logs a TODO message instead of creating a calendar block. Depends on Google Calendar MCP integration.
- **Hobby CRUD not implemented.** GET and POST `/api/hobbies` return 501. The settings page depends on this.
- **No rate limiting or request validation beyond shape checks.** Single-user local app — acceptable for now but would need hardening for any multi-user scenario.

### Tests

`app/api/plan/__tests__/plan.test.ts` — 19 tests covering the five plan endpoints. Mocks the Anthropic SDK and better-sqlite3. Tests cover happy paths, missing fields (400), not found (404), and invalid state transitions (409).
