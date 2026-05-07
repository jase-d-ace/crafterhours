# Task: Session Completion & Progress Tracking

### Goal
Close the back half of the checkpoint flow — session → log → artifact. The `sessions`
and `artifacts` tables exist but are empty. `saveSession`, `saveArtifact`, and
`getRecentSessions` in `lib/db.ts` are stubs. This task wires up the full completion
loop so sessions are recorded, artifacts are generated and saved, and recency data is
real and usable by the recommender.

UX: logging happens in the existing chat thread. Agent prompts "How did it go?" when
the user returns. Artifact is shown as a special preview card (matching the plan card
pattern). User explicitly saves — never auto-save.

---

## Phases

### Phase A — Close the loop (this task)
### Phase B — History page (natural follow-on once data exists)
### Phase C — Live recommender (swap mock for real `getRecentSessions`)

---

## Phase A implementation

### 1. `lib/types.ts` — add new types

```typescript
export type Session = {
  id: string
  hobbyId: string
  duration: number       // actual minutes
  notes: string
  artifactType: 'journal' | 'practice_log' | 'coding_summary'
  createdAt: string
}

export type SaveSessionInput = Omit<Session, 'id' | 'createdAt'>
export type SaveArtifactInput = Omit<Artifact, 'id' | 'createdAt'>
```

### 2. `lib/db.ts` — implement 3 stubs

**`getRecentSessions(limit = 10): Session[]`**
```sql
SELECT s.*, h.name as hobby_name, h.emoji
FROM sessions s
JOIN hobbies h ON s.hobby_id = h.id
ORDER BY s.created_at DESC
LIMIT ?
```

**`saveSession(data: SaveSessionInput): Session`**
```sql
INSERT INTO sessions (id, hobby_id, duration, notes, artifact_type, created_at)
VALUES (?, ?, ?, ?, ?, ?)
```
`id` = crypto.randomUUID(), `created_at` = new Date().toISOString()

**`saveArtifact(data: SaveArtifactInput): Artifact`**
```sql
INSERT INTO artifacts (id, session_id, hobby_id, type, content, created_at)
VALUES (?, ?, ?, ?, ?, ?)
```

### 3. API routes

**`app/api/session/route.ts`**

POST body:
```typescript
{
  sessionId: string      // session_state id
  actualDuration: number // client-tracked elapsed minutes
  notes: string          // user's log text from chat
  artifactType: 'journal' | 'practice_log' | 'coding_summary'
}
```
- Fetch session_state by `sessionId`, validate status === 'confirmed'
- Call `saveSession()` → returns `Session` with new id
- Update session_state status to `'completed'`
- Return `{ session }`

GET — returns `getRecentSessions(10)` for history + recommender.

**`app/api/artifact/route.ts`**

POST body:
```typescript
{
  sessionId: string   // session_state id (to get hobby + plan context)
  dbSessionId: string // sessions table id (FK for artifact)
  notes: string
  hobbyId: string
}
```
- Fetch session_state and hobby from DB
- Call artifact generator from `lib/artifactGenerators.ts` — implement real Claude call
  using session plan + notes + hobby context
- Stream artifact content back to client
- Client shows preview; on explicit save, POST to `/api/artifact/save`

**`app/api/artifact/save/route.ts`** (new sub-route)

POST body: `{ dbSessionId, hobbyId, type, content }`
- Call `saveArtifact()`, return `{ artifact }`

### 4. `hooks/useSession.ts` — new phases

Add to `SessionPhase` union:
```typescript
| 'session_active'    // plan confirmed, timer running
| 'logging'          // user returned, agent asking how it went
| 'artifact_preview' // artifact generated, awaiting save
| 'completed'        // artifact saved, session done
```

New state:
```typescript
dbSessionId: string | null   // sessions table id after POST /api/session
artifactDraft: string | null // streamed artifact content
elapsedMinutes: number       // client timer, starts on 'confirmed' transition
```

Transitions:
- `confirmed` → agent sends closing message → "I'm back" button visible → click → `logging`
- User sends log message → POST `/api/session` → phase shifts to `artifact_preview`,
  triggers artifact generation stream
- User clicks "Save" on artifact card → POST `/api/artifact/save` → phase → `completed`
- Timer (setInterval every second) starts on entering `confirmed`, stops on `logging`

### 5. UI changes

**`app/page.tsx`**
- Show elapsed timer when phase === `'session_active'` (beside session plan card, not in chat)
- Show "I'm back" button when phase === `'session_active'`
- Button click: sends "I'm back — ready to log" agent prompt, transitions to `logging`

**`components/ArtifactPreview/ArtifactPreview.tsx`** (currently stub)
- Props: `artifact: string (markdown)`, `onSave: () => void`, `onEdit: (edited: string) => void`
- Renders markdown content
- "Save" button calls `onSave`; simple textarea edit mode
- Injected into chat message list as a special message type (same pattern as plan card)

**`session_state` status**
- Add `'completed'` as a valid status. No migration needed — TEXT column, no CHECK constraint.

---

## Critical files
- `lib/types.ts` — add Session, SaveSessionInput, SaveArtifactInput
- `lib/db.ts` — implement 3 stubs
- `app/api/session/route.ts` — implement POST + GET
- `app/api/artifact/route.ts` — implement streaming generation
- `app/api/artifact/save/route.ts` — new save sub-route
- `hooks/useSession.ts` — new phases, timer, dbSessionId state
- `app/page.tsx` — timer display, "I'm back" button, phase rendering
- `components/ArtifactPreview/ArtifactPreview.tsx` — implement from stub
- `lib/artifactGenerators.ts` — implement real Claude calls

---

## Verification
- [ ] Start a planning session → confirm plan → timer appears, "I'm back" button shows
- [ ] Click "I'm back" → agent prompts how it went
- [ ] Send log text → `sessions` table has a new row
- [ ] Artifact streams in → preview card renders in chat
- [ ] Click "Save" → `artifacts` table has a new row with correct `session_id` FK
- [ ] `GET /api/session` returns the completed session
- [ ] `npm run typecheck` and `npm run lint` pass clean

---

## Phase B implementation — History page

### Goal
Turn the empty `/history` stub into a usable view of past sessions and their
artifacts. Read-only — no edits to existing sessions or artifacts. Nav link
already exists in `components/AppHeader.tsx`; the page is just a placeholder.

### 1. `lib/types.ts` — add new type

```typescript
export type SessionDetail = Session & {
  hobby: Hobby
  artifact: Artifact | null
}
```

A session can exist without an artifact (user skipped save), so artifact is
nullable.

### 2. `lib/db.ts` — add 2 functions

**`getSessionDetails(limit = 50): SessionDetail[]`**
```sql
SELECT
  s.*,
  h.id as hobby_id, h.name as hobby_name, h.emoji, h.goal,
  h.focus_areas, h.active, h.created_at as hobby_created_at,
  a.id as artifact_id, a.type as artifact_type_full,
  a.content as artifact_content, a.created_at as artifact_created_at
FROM sessions s
JOIN hobbies h ON s.hobby_id = h.id
LEFT JOIN artifacts a ON a.session_id = s.id
ORDER BY s.created_at DESC
LIMIT ?
```

Maps each row to `SessionDetail`. Aliases are needed because `id`, `created_at`,
and `type` collide across the three joined tables.

**`getArtifactBySessionId(sessionId: string): Artifact | null`**
```sql
SELECT * FROM artifacts WHERE session_id = ? LIMIT 1
```

Small helper, useful if a future detail view needs to refetch a single artifact.

Keep `getRecentSessions` unchanged — Phase C needs it to stay raw (no joins).

### 3. API route

**`app/api/history/route.ts`** (new)

```typescript
GET /api/history → { sessions: SessionDetail[] }
```

Calls `getSessionDetails(50)`. No pagination — single-user local app at this scale.

Don't enrich the existing `GET /api/session`; keeping endpoints separate avoids
overfetching for the recommender (Phase C) which only needs raw rows.

### 4. Page — `app/history/page.tsx`

Replace the stub. Client component, fetches `/api/history` on mount.

Layout matches `app/page.tsx` (centered max-w-640 from `app/layout.tsx`,
craft-gray-900 cards).

Per-session card, descending by `createdAt`:
- Hobby emoji + name
- Date — relative for recent (`Today`, `Yesterday`, `3 days ago`), absolute
  beyond a week
- Duration ("47 min")
- One-line truncated note
- Click → expands inline to show full notes + artifact markdown content
  (collapsible, not a separate route)

Empty state: "No sessions yet — finish your first one and it'll show up here."

Render inline in the page rather than extracting a new component yet — it's a
single use site and the shape may evolve.

---

## Phase B critical files
- `lib/types.ts` — add `SessionDetail`
- `lib/db.ts` — add `getSessionDetails`, `getArtifactBySessionId`
- `app/api/history/route.ts` — new GET endpoint
- `app/history/page.tsx` — replace stub with real list view

## Phase B verification
- [ ] Visit `/history` with empty DB → empty state copy renders
- [ ] Complete a full session via `/` → revisit `/history` → row appears at top
      with correct hobby, duration, and note preview
- [ ] Click row → expands to show full notes + artifact markdown
- [ ] Save artifact for one session, skip for another → first shows artifact
      block, second shows "No artifact saved" inline
- [ ] `npm run typecheck` and `npm run lint` pass clean

---

## Phase C implementation — Live recommender

### Goal
Replace the mocked recommendation in `app/api/recommend/route.ts` with one
driven by real session history plus a small Claude call for personalized
reasoning. Empty DB → recommender returns null → client falls through to a
hobby picker (reusing the existing redirect flow). Calendar and GitHub context
are deferred to a separate phase.

### Decisions baked in
- **Reasoning:** Claude-generated, non-streaming, ~120 tokens. Templates lose the
  "remembered context" feel that makes the recommender worth having.
- **Reasoning input:** Gap (hours if <24h, else days) + last session's notes.
  Artifacts excluded — too long, mostly redundant with notes.
- **Empty DB:** `{ recommendation: null, allHobbies }` → client routes through
  existing `redirecting` phase ("What are you feeling tonight?"). No new UI.
- **Single-hobby case:** Hide the "Actually, I'd rather..." button on
  `RecommendationCard` via a `canRedirect: boolean` prop.
- **All-touched-today:** Resolved by Claude-generated reasoning (phrases hours
  naturally).

### 1. `lib/claude.ts` — add reasoning generator

New non-streaming function (mirror `getOpeningMessage` shape) and new system
prompt. Existing prompts untouched per CLAUDE.md.

```typescript
export async function generateRecommendationReasoning(
  hobby: Hobby,
  lastSession: Session | null,
): Promise<string>
```

User message: hobby details + gap (hours or days) + last session's notes.
Returns 1–2 sentence string from `response.content[0].text`.

### 2. `lib/recommender.ts` — implement `buildRecommendation`

Replace the `NotImplementedError` stub:

```typescript
export async function buildRecommendation(): Promise<{
  recommendation: Recommendation | null
  allHobbies: Hobby[]
}>
```

Algorithm:
1. `getHobbies()` and `getRecentSessions(50)`
2. If no sessions → return `{ recommendation: null, allHobbies }`
3. Build `Map<hobbyId, Session>` of most recent session per hobby (sessions are
   already DESC, so first-seen wins)
4. Sort hobbies ascending by last-session time; never-touched first (`-Infinity`)
5. `primary = sorted[0]`, `alternative = sorted[1]` (may be undefined)
6. Call `generateRecommendationReasoning(primary, lastSession)` for reasoning
7. Return `{ recommendation: { hobby: primary, reasoning, confidence: 0.7,
   alternativeHobby: alternative, lastSession: lastSession?.createdAt }, allHobbies }`

### 3. `app/api/recommend/route.ts` — swap mock for real

```typescript
import { buildRecommendation } from '@/lib/recommender'

export async function GET() {
  const data = await buildRecommendation()
  return NextResponse.json(data)
}
```

Mock at `lib/mocks/recommend.ts` no longer imported.

### 4. `hooks/useSession.ts` — null-recommendation routing

In the mount `useEffect`:

```typescript
setAllHobbies(data.allHobbies)
if (data.recommendation) {
  setRecommendation(data.recommendation)
  setPhase('recommended')
} else {
  setPhase('redirecting')  // empty DB → picker
}
```

Update `alternatives`:

```typescript
const alternatives = recommendation
  ? allHobbies.filter((h) => h.id !== recommendation.hobby.id)
  : allHobbies
```

### 5. `components/RecommendationCard/RecommendationCard.tsx`

Add `canRedirect: boolean` prop. Wrap the redirect button in `{canRedirect && (...)}`.

### 6. `app/page.tsx`

Pass `canRedirect={alternatives.length > 0}` to `RecommendationCard`.

---

## Phase C critical files
- `lib/claude.ts` — add `generateRecommendationReasoning` + prompt
- `lib/recommender.ts` — implement `buildRecommendation`
- `app/api/recommend/route.ts` — swap mock for real
- `hooks/useSession.ts` — null-recommendation routing + alternatives fallback
- `components/RecommendationCard/RecommendationCard.tsx` — `canRedirect` prop
- `app/page.tsx` — pass `canRedirect`

## Phase C verification
- [ ] Empty DB: load `/` → goes directly to hobby picker, no recommendation flash
- [ ] Pick from picker → enters planning phase normally
- [ ] Complete one guitar session, reload `/` → does NOT pick guitar; reasoning
      references the gap and is non-generic
- [ ] Complete sessions for all three hobbies → picks the oldest; alternative is
      second-oldest; reasoning references last notes
- [ ] Reload immediately after a session → reasoning phrases gap in hours, not
      "0 days ago"
- [ ] Single-hobby case (deactivate two hobbies in DB): redirect button is hidden
- [ ] `npm run typecheck` and `npm run lint` pass clean

## Out of scope (deferred to a separate phase)
- Calendar context (`calendarContext`) — needs `lib/calendar.ts` MCP wrapper
- GitHub context (`githubContext`) — needs `lib/github.ts` MCP wrapper
- Rich confidence calculation — fixed at 0.7 for now
- Hobby management UI — `/settings` is "coming soon", not a recommender concern
