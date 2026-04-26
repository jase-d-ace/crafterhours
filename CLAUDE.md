# CrafterHours — Claude Code context

## What this project is
A personal evening coaching app called CrafterHours. The user
opens it after work and a conversational agent recommends what
hobby to focus on tonight based on recency history, Google
Calendar context, and recent GitHub activity. The agent conducts
a back-and-forth planning conversation to build a session plan
appropriate for that hobby. At the end of the session the user
logs what happened and the agent helps produce a tangible
artifact — a markdown journal entry, a practice log, or a
coding summary. All data lives in a local SQLite database.
Hobbies, goals, and focus areas are fully user-configurable
via a settings page. No accounts, no auth, single-user local app.

## Stack
- Framework: Next.js 14 (App Router)
- Language: TypeScript, strict mode
- Styling: Tailwind CSS
- Database: SQLite via better-sqlite3
- AI: Anthropic SDK (claude-sonnet-4-6)
- MCP connectors: Google Calendar (read + write), GitHub (read)
- Package manager: npm
- Node version: 20+

## Project structure
- `app/` — Next.js App Router pages and layouts
- `app/page.tsx` — main evening session page
- `app/settings/` — hobby and goal configuration page
- `app/history/` — past sessions and artifacts
- `app/api/session/` — session management routes
- `app/api/recommend/` — orchestrator: reads hobby history +
  calendar + github, returns recommendation
- `app/api/plan/` — planning conversation route, hobby-aware
- `app/api/artifact/` — generates and saves end-of-session
  artifact
- `app/api/hobbies/` — CRUD routes for hobby configuration
- `components/Chat/` — conversational UI, supports streaming
- `components/SessionPlan/` — renders the agreed session plan
- `components/HobbyCard/` — hobby display with last-touched date
- `components/ArtifactPreview/` — shows generated artifact
  before saving
- `lib/claude.ts` — Claude API client and all prompt templates
- `lib/db.ts` — SQLite connection and all query functions
- `lib/github.ts` — GitHub MCP client wrapper
- `lib/calendar.ts` — Google Calendar MCP client wrapper
- `lib/recommender.ts` — orchestration logic: reads all sources,
  synthesizes recommendation
- `lib/artifactGenerators.ts` — per-hobby artifact generation
  logic (journal, practice log, coding summary)
- `lib/hobbies.ts` — hobby config types and helpers
- `lib/migrations/` — SQL migration files, run in order
- `scripts/migrate.js` — runs all files in lib/migrations/ in order

## Environment variables (never hardcode these)
- `ANTHROPIC_API_KEY`
- `GITHUB_TOKEN`
- `GOOGLE_CALENDAR_ID` — the specific calendar to read/write,
  never infer or default this to another calendar
- `DATABASE_PATH` (defaults to ./crafterhours.db)

## Commands
- Dev server: `npm run dev`
- Type check: `npm run typecheck` (runs `tsc --noEmit`)
- Lint: `npm run lint`
- Build: `npm run build`
- DB migrate: `npm run db:migrate` (runs scripts/migrate.js)
- Always run typecheck and lint before considering any task done

## Database schema — core tables
- `hobbies` — user-configured hobbies with goals and focus areas
- `sessions` — completed evening sessions with hobby, duration,
  notes, and artifact type
- `artifacts` — generated artifacts linked to sessions
- `session_state` — in-progress session state for resumability

## Core types — define these exactly

### Hobby
```typescript
export type Hobby = {
  id: string
  name: string
  emoji: string
  goal: string          // e.g. "become a blues/rock songwriter"
  focusAreas: string[]  // e.g. ["chord progressions", "lyrics"]
  active: boolean
  createdAt: string
}
```

### Recommendation
```typescript
export type Recommendation = {
  hobby: Hobby
  reasoning: string        // why this hobby tonight
  confidence: number       // 0–1
  alternativeHobby?: Hobby // if user wants to redirect
  calendarContext?: string // e.g. "early morning tomorrow at 7am"
  githubContext?: string   // e.g. "no commits in 4 days"
  lastSession?: string     // ISO date of last session for this hobby
}
```

### SessionPlan
```typescript
export type SessionPlan = {
  hobbyId: string
  duration: number         // minutes
  structure: PlanItem[]
  intention: string        // one sentence — what success looks like
}

export type PlanItem = {
  goal: string
  duration: number
  phase: 'warmup' | 'main' | 'cooldown' | 'reflection'
}
```

### Artifact
```typescript
export type Artifact = {
  id: string
  sessionId: string
  hobbyId: string
  type: 'journal' | 'practice_log' | 'coding_summary'
  content: string          // markdown
  createdAt: string
}
```

## Initial hobby rotation
Three hobbies are seeded via lib/migrations/002_seed_hobbies.sql.
The agent must understand each hobby's coaching approach:

### Guitar (hobby_guitar) 🎸
- Level: intermediate — comfortable with basics, building vocabulary
- Goal: become a well-rounded blues/rock songwriter who can write,
  play, and feel the music — not just execute it technically
- Focus areas: improvisation and soloing over blues/pentatonic scales,
  songwriting and composition, music theory and chord construction,
  rhythm and strumming patterns
- Session plan style: structured practice with specific exercises,
  scales, chord voicings, or song fragments tied to the user's
  blues/rock songwriter goal
- Artifact type: practice_log — what was practiced, what clicked,
  what to revisit next session

### Writing (hobby_writing) ✍️
- Level: multi-form — moves between journaling, creative writing,
  poetry, lyric writing, and essays depending on the night
- Goal: build a consistent writing practice across multiple forms
  and get comfortable moving between them
- Focus areas: raw journaling, creative writing, poetry and lyric
  writing, essays and structured thinking
- Session plan style: the agent asks what kind of writing feels
  right tonight before planning — never assumes the format.
  Provides a specific prompt or creative direction once the form
  is chosen
- Artifact type: journal — the actual writing produced, saved as
  markdown

### Building (hobby_building) 🛠️
- Level: senior engineer — strong full-stack fundamentals,
  actively learning agentic workflows and Claude Code
- Goal: become fluent in agentic development, ship personal tools,
  deepen full-stack skills, and use every session to produce
  something real and committable
- Focus areas: agentic workflows and Claude Code, full-stack
  features and side projects, personal tools for daily use
- Session plan style: a scoped, completable goal that results in
  something committable by end of session — no open-ended
  exploration without a defined output
- Artifact type: coding_summary — what was built, key decisions
  made, what's left for next session, git commit reference

## Hobby-aware behavior — important
When the hobby type is unknown or user-defined (added later via
settings), the agent must ask the user what a productive session
looks like for them before planning. Never apply guitar or writing
structure to an unknown hobby.

## MCP usage

### Google Calendar — read + write
- READ: check the next 18 hours of the user's personal calendar
  for events that should influence tonight's recommendation —
  early morning commitments, late evening events, back-to-back
  days, existing CrafterHours blocks
- WRITE: create a calendar block when the user confirms a session
  plan. Update the block when the session ends.
- Calendar block format (planned):
  "[emoji] [Hobby] · [focus area]"
  e.g. "🎸 Guitar · Songwriting & chord theory"
- Calendar block format (completed):
  "✓ [emoji] [Hobby] · [focus area]"
  e.g. "✓ 🎸 Guitar · Songwriting & chord theory"
- ONLY read from and write to the calendar specified in
  GOOGLE_CALENDAR_ID — never touch any other calendar
- Never delete calendar events — only create and update
- The user's work calendar and personal calendar are completely
  separate — GOOGLE_CALENDAR_ID always refers to personal only

### GitHub — read only
- Read the authenticated user's commits from the last 7 days
- Use this to inform recency for the Building hobby specifically
- If no commits in 3+ days and Building hasn't been sessioned
  recently, factor this into the recommendation
- Never write to GitHub

## Agent interaction model — checkpoints
CrafterHours uses a checkpoint-based conversational flow.
Never skip or auto-advance past a checkpoint.

1. **Open** — agent reads hobby history, calendar, and GitHub,
   then leads with a recommendation and its reasoning
2. **Confirm or redirect** — user confirms the hobby or pushes
   back. If redirected, agent adjusts without friction and does
   not argue. One redirect max before accepting user choice.
3. **Plan** — agent conducts a focused planning conversation
   (2–4 exchanges). For writing, it asks what form tonight.
   For guitar, it asks what the user wants to work on or
   suggests based on last session. For building, it scopes
   a completable goal.
4. **Present plan** — agent presents a full SessionPlan.
   User approves or requests edits. Agent adjusts once if needed.
5. **Session** — user does the work. App stays open. Timer
   displayed based on SessionPlan duration.
6. **Log** — user returns and briefly logs how it went —
   what happened, what felt good, what didn't
7. **Artifact** — agent generates artifact draft based on
   the session log and hobby type. User reviews before saving.
   Never auto-save without explicit user confirmation.

## Tone and personality
CrafterHours is a personal tool for one user. The agent's tone
should feel like a knowledgeable friend who respects your time —
direct, warm, never preachy. It has opinions (it will recommend
things) but holds them loosely (it won't argue if you redirect).
It gets excited about the hobbies because they're worth being
excited about. It does not use corporate language, does not say
"Great choice!" after every input, and does not over-explain.

## What Claude must never touch without explicit permission
- Database migration files in `lib/migrations/`
- Prompt templates in `lib/claude.ts`
- MCP client wrappers in `lib/github.ts` and `lib/calendar.ts`
- `next.config.js`
- The GOOGLE_CALENDAR_ID environment variable logic —
  never default to a different calendar if this is missing,
  throw a clear configuration error instead

## Autonomy preferences
- Stop and confirm before: installing new packages, creating
  new top-level directories, modifying prompt templates,
  changing database schema, touching any MCP client file
- After each logical phase, summarize what was done and what's
  next, then wait for confirmation before continuing
- If something is ambiguous about hobby behavior, agent tone,
  or calendar write behavior — ask. This is personal software
  and the details matter.
- If GOOGLE_CALENDAR_ID is not set, fail loudly with a clear
  error message pointing to .env — do not
  silently skip calendar functionality

## PR conventions
- Branch: `feat/`, `fix/`, `chore/` prefix
    e.g. `feat/add-guitar-practice-plan-generator`
- Commits: conventional commits
  e.g. `feat: add guitar practice plan generator`
- PRs to `branch`, always draft first
- Use `gh pr create` to create PRs from the CLI
- PR title: short, under 70 characters
- PR body must include a `## Summary` section with 1–3 bullet
  points and a `## Test plan` section with a checklist
- Always push the branch with `git push origin <branch>`
  before creating the PR
- Never force-push to main
