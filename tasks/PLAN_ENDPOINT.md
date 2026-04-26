## Task: Planning conversation API — app/api/plan/

### Goal
Implement the full planning conversation API for CrafterHours.
This is the core interactive loop of the app — a streamed,
hobby-aware conversation between the user and Claude that
produces a confirmed SessionPlan saved to SQLite. Five endpoints,
one active session at a time, hobby-specific prompt templates
hardcoded for the three initial hobbies.

### Endpoints to implement

#### POST /api/plan/start
Begins a new planning conversation for a given hobby.
If a plan session is already active (status = 'planning' in
session_state table), abandon it first before creating the new
one — only one active plan at a time.

Request body:
```json
{
  "hobbyId": "hobby_guitar"
}
```

Behavior:
- Look up hobby via `getHobbyById(hobbyId)` from `lib/db.ts`
- Create a new session_state row in SQLite with:
  - status: 'planning'
  - hobbyId
  - messages: [] (empty JSON array)
  - createdAt: now
- Select the correct system prompt for the hobby (see prompt
  templates below)
- Send the opening assistant message via Claude API
  (non-streaming for the opener — just return it directly)
- Save the opening message to session_state.messages
- Return:
```json
{
  "sessionId": "uuid",
  "hobbyId": "hobby_guitar",
  "openingMessage": "string — Claude's opening message"
}
```

Error cases:
- Missing hobbyId: 400 { error: "hobbyId required", code: "MISSING_HOBBY_ID" }
- Unknown hobbyId: 404 { error: "Hobby not found", code: "HOBBY_NOT_FOUND" }

---

#### POST /api/plan/message
Sends a user message and returns a streamed Claude response.
This is the main back-and-forth exchange during planning.

Request body:
```json
{
  "sessionId": "uuid",
  "message": "string"
}
```

Behavior:
- Load session_state row by sessionId
- Verify status is 'planning' — reject if not
- Append user message to session_state.messages
- Send full conversation history to Claude API with the
  hobby's system prompt — use streaming
- As tokens arrive, write them to the response stream
- When stream completes, append full assistant response
  to session_state.messages and save to SQLite
- Return: a ReadableStream (text/event-stream) of tokens

Error cases:
- Missing sessionId or message: 400 { error: "sessionId and
  message required", code: "MISSING_FIELDS" }
- Session not found: 404 { error: "Session not found",
  code: "SESSION_NOT_FOUND" }
- Session not in planning state: 409 { error: "Session is
  not in planning state", code: "INVALID_SESSION_STATE" }

---

#### GET /api/plan/session
Retrieves the current session state including full message
history. Used by the frontend to restore state on page reload.

Query params: ?sessionId=uuid

Returns:
```json
{
  "sessionId": "uuid",
  "hobbyId": "string",
  "status": "planning | confirmed | abandoned",
  "messages": [
    { "role": "user | assistant", "content": "string" }
  ],
  "sessionPlan": null
}
```

Error cases:
- Missing sessionId: 400 { error: "sessionId required",
  code: "MISSING_SESSION_ID" }
- Not found: 404 { error: "Session not found",
  code: "SESSION_NOT_FOUND" }

---

#### POST /api/plan/confirm
Locks in the agreed SessionPlan. Parses the final plan from
the conversation, saves it to SQLite, updates session status
to 'confirmed'. Calendar write is stubbed — log a console
message "TODO: write calendar block" and return without error.

Request body:
```json
{
  "sessionId": "uuid",
  "sessionPlan": {
    "hobbyId": "string",
    "duration": 90,
    "intention": "string",
    "structure": [
      {
        "title": "string",
        "description": "string",
        "durationMinutes": 20,
        "type": "warmup | main | cooldown | reflection"
      }
    ]
  }
}
```

Behavior:
- Validate sessionPlan shape matches SessionPlan type exactly
- Update session_state: status → 'confirmed',
  sessionPlan → JSON stringified plan
- Log "TODO: write calendar block for [hobbyId] at [duration]min"
- Return:
```json
{
  "sessionId": "uuid",
  "status": "confirmed",
  "sessionPlan": { ...the saved plan }
}
```

Error cases:
- Missing fields: 400 { error: "sessionId and sessionPlan
  required", code: "MISSING_FIELDS" }
- Invalid sessionPlan shape: 400 { error: "Invalid session
  plan structure", code: "INVALID_PLAN" }
- Session not found: 404
- Session already confirmed or abandoned: 409 { error:
  "Session cannot be confirmed in its current state",
  code: "INVALID_SESSION_STATE" }

---

#### POST /api/plan/abandon
Discards an in-progress plan session.

Request body:
```json
{
  "sessionId": "uuid"
}
```

Behavior:
- Update session_state: status → 'abandoned'
- Return:
```json
{
  "sessionId": "uuid",
  "status": "abandoned"
}
```

Error cases:
- Missing sessionId: 400 { error: "sessionId required",
  code: "MISSING_SESSION_ID" }
- Session not found: 404
- Session already confirmed or abandoned: 409 { error:
  "Session is already finalized", code: "INVALID_SESSION_STATE" }

---

### Prompt templates — hardcode these in lib/claude.ts

**This task is the explicit authorization to modify
`lib/claude.ts`.** CLAUDE.md restricts changes to prompt
templates in this file without permission. This authorization
is scoped to this task only — future tasks must obtain their
own explicit permission before modifying `lib/claude.ts`.

Each hobby gets a system prompt used for every message in
its planning conversation. Write them exactly as follows —
these are the creative core of the app and are intentionally
specific to the user's goals.

#### Guitar system prompt
```
You are a guitar practice coach for an intermediate blues/rock
player whose goal is to become a well-rounded songwriter —
someone who can write, play, and feel the music, not just
execute it technically.

Your job is to plan tonight's guitar session. You have 2–4
exchanges to understand what the user wants to work on tonight
and build a concrete SessionPlan. Be specific — not "practice
scales" but "work through the minor pentatonic in A at the 5th
fret, connecting boxes 1 and 2."

Focus areas you can draw from:
- Improvisation and soloing over blues/pentatonic scales
- Songwriting and composition — riffs, progressions, full songs
- Music theory and chord construction
- Rhythm and strumming patterns and groove

Start by asking one focused question: what do they want to
feel or accomplish by the end of tonight's session? Then build
the plan around their answer.

When you've agreed on a plan, present a succinct summary of
the session. At the very end of your message, include a fenced
```json code block containing the SessionPlan object with keys:
hobbyId, duration, intention, structure. The system will strip
this block before displaying your message — the user only sees
your summary.

Be direct and warm. No corporate language. No "Great choice!"
after every message. Talk like a musician, not a productivity app.
```

#### Writing system prompt
```
You are a writing coach for someone who moves between multiple
forms — journaling, creative writing, poetry, lyric writing,
and essays — depending on what they need on a given night.

Your job is to plan tonight's writing session. You have 2–4
exchanges to land on a specific form and direction for tonight,
then build a concrete SessionPlan with a real prompt or
creative starting point.

Always ask what kind of writing feels right tonight before
assuming a format. Never plan a journaling session when they
want to write fiction. Once the form is clear, give them
something specific to work toward — a first line, a constraint,
a question to explore, a scene to write into.

When you've agreed on a plan, present a succinct summary of
the session. At the very end of your message, include a fenced
```json code block containing the SessionPlan object with keys:
hobbyId, duration, intention, structure. The system will strip
this block before displaying your message — the user only sees
your summary.

Be direct and warm. Talk like a writer, not a productivity app.
No hollow encouragement.
```

#### Building system prompt
```
You are a coding session coach for a senior engineer who wants
to become fluent in agentic development and ship personal tools
that solve real problems.

Your job is to plan tonight's building session. You have 2–4
exchanges to scope a goal that is completable tonight and
produces something real — a working feature, a committed file,
a solved problem. No open-ended exploration without a defined
output.

Focus areas you can draw from:
- Agentic workflows and Claude Code patterns
- Full-stack features across Next.js, TypeScript, Node
- Personal tools that solve daily friction

Start by asking what they want to have shipped by the end of
tonight. If they're not sure, suggest something based on what
a senior engineer working on personal tools might find valuable.
Then scope it to something achievable in one session.

When you've agreed on a plan, present a succinct summary of
the session. At the very end of your message, include a fenced
```json code block containing the SessionPlan object with keys:
hobbyId, duration, intention, structure. The system will strip
this block before displaying your message — the user only sees
your summary.

Be direct. Talk like an engineer. No filler encouragement.
```

---

### Functions to add in lib/claude.ts
Replace the existing `conductPlanningConversation` stub with
these two functions:

- `getOpeningMessage(hobbyId: string): Promise<string>` —
  non-streaming call for POST /api/plan/start. Sends the
  hobby's system prompt with no user messages and returns the
  full assistant response as a string.
- `streamPlanningResponse(messages: Message[], hobbyId: string): AsyncIterable<string>` —
  streaming call for POST /api/plan/message. Sends full
  conversation history with the hobby's system prompt, yields
  text chunks as they arrive.

Keep `getRecommendation` and `generateArtifact` stubs as-is.

Initialize the Anthropic client at module level:
```typescript
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic()
```
The SDK reads `ANTHROPIC_API_KEY` from the environment
automatically — do not pass it explicitly.

Use model `claude-sonnet-4-6` for all Claude API calls.
Use `max_tokens: 1024`.
Use `crypto.randomUUID()` for session ID generation.

---

### Files to create or modify
- `app/api/plan/route.ts` — delete (scaffold stub conflicts
  with the sub-routes below)
- `app/api/plan/start/route.ts` — create
- `app/api/plan/message/route.ts` — create (streaming)
- `app/api/plan/session/route.ts` — create
- `app/api/plan/confirm/route.ts` — create
- `app/api/plan/abandon/route.ts` — create
- `lib/claude.ts` — add three hobby system prompts,
  getOpeningMessage, streamPlanningResponse (see functions
  section above)
- `lib/db.ts` — add session_state CRUD functions:
  createSession, getSession, updateSessionMessages,
  updateSessionStatus, updateSessionPlan, abandonActiveSessions
  (abandonActiveSessions must update ALL rows where
  status = 'planning' to 'abandoned', enforcing the
  one-active-session invariant).
  Database connection and `getHobbyById` already exist.

### Do NOT touch
- `lib/calendar.ts` — calendar write is stubbed in confirm,
  not implemented
- `lib/github.ts`
- `lib/recommender.ts`
- `app/api/recommend/`
- Any existing migration files
- `next.config.mjs`

### Streaming implementation note
`POST /api/plan/message` must return a `ReadableStream` using
Next.js App Router streaming conventions:
```typescript
const encoder = new TextEncoder()

return new Response(
  new ReadableStream({
    async start(controller) {
      const stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-6',
        system: systemPrompt,
        messages: conversationHistory,
        max_tokens: 1024,
      })
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
    }
  }),
  { headers: { 'Content-Type': 'text/event-stream' } }
)
```

Save the complete assembled response to SQLite only after the
stream closes — not during.

### Session state columns (reference)
Table `session_state` — migration already applied.
`id`, `hobby_id`, `status`, `messages`, `session_plan`,
`created_at`, `updated_at`. Snake_case in SQLite, map to
camelCase in the lib/db.ts CRUD functions.

### Jest tests — one per endpoint
Write a test file at `app/api/plan/__tests__/plan.test.ts`.
For each endpoint test:
- Happy path — correct input returns correct shape
- Missing required fields — returns 400 with correct code
- Session not found — returns 404
- Invalid state transitions — returns 409 where specified

Mock the Anthropic SDK in tests — do not make real API calls.
Mock better-sqlite3 — do not touch a real database in tests.

### Done criteria
- [ ] All five endpoints exist and return correct shapes
- [ ] POST /api/plan/message streams correctly
- [ ] Only one active session at a time — starting a new one
      abandons the current
- [ ] All three hobby system prompts live in lib/claude.ts
- [ ] session_state CRUD functions exist in lib/db.ts
- [ ] Calendar write is stubbed with a console.log in confirm
- [ ] Jest tests pass for all five endpoints
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run lint` passes clean
