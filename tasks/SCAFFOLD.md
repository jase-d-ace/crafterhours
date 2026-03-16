## Task: Project scaffold — CrafterHours

### Goal
Create the initial Next.js project structure for CrafterHours.
Greenfield scaffold only — no agent logic, no MCP calls, no
real database queries yet. Get the skeleton right so every
subsequent task has a clean foundation to build on.

### What to create
- Next.js 14 app with App Router, TypeScript strict, Tailwind CSS
- Full directory structure matching CLAUDE.md exactly
- Placeholder files with correct types exported:

  `lib/db.ts`
  - Export placeholder functions: getHobbies, getRecentSessions,
    saveSession, saveArtifact — all throw NotImplementedError
  - Export all four core types: Hobby, Recommendation,
    SessionPlan, Artifact (from CLAUDE.md)

  `lib/claude.ts`
  - Export placeholder functions: getRecommendation,
    conductPlanningConversation, generateArtifact
  - All throw NotImplementedError

  `lib/recommender.ts`
  - Export placeholder buildRecommendation function
  - Throws NotImplementedError

  `lib/artifactGenerators.ts`
  - Export placeholder generateJournal, generatePracticeLog,
    generateCodingSummary — all throw NotImplementedError

  `lib/github.ts`
  - Export placeholder getRecentCommits function
  - Throws NotImplementedError

  `lib/calendar.ts`
  - Export placeholder getTonightContext function
  - Throws NotImplementedError

  `lib/hobbies.ts`
  - Export Hobby type and placeholder hobby helpers

  `components/Chat/Chat.tsx`
  - Empty component, accepts messages prop (Message[] type)
    and onSend prop

  `components/SessionPlan/SessionPlan.tsx`
  - Empty component, accepts SessionPlan prop

  `components/HobbyCard/HobbyCard.tsx`
  - Empty component, accepts Hobby and lastSession props

  `components/ArtifactPreview/ArtifactPreview.tsx`
  - Empty component, accepts Artifact prop and onSave callback

  `app/api/recommend/route.ts`
  - Stubbed GET, returns 501 { error: "Not implemented",
    code: "NOT_IMPLEMENTED" }

  `app/api/plan/route.ts`
  - Stubbed POST, returns 501

  `app/api/artifact/route.ts`
  - Stubbed POST, returns 501

  `app/api/hobbies/route.ts`
  - Stubbed GET and POST, both return 501

  `app/api/session/route.ts`
  - Stubbed GET and POST, both return 501

  `app/settings/page.tsx`
  - Empty settings page with placeholder heading

  `app/history/page.tsx`
  - Empty history page with placeholder heading

- Database migration file at `lib/migrations/001_initial.sql`
  with CREATE TABLE statements for: hobbies, sessions,
  artifacts, session_state — matching the schema in CLAUDE.md

- `npm run db:migrate` script in package.json that runs the
  migration file via better-sqlite3

- `.env.local` with all four environment variable keys

- Update README.md with project name, one-paragraph
  description, and local setup steps

### Do not implement yet
- Any real Claude API calls
- Any MCP calls
- Real database queries
- Chat UI logic
- Recommendation logic
- Any artifact generation

### Done criteria
- [ ] `npm run dev` starts without errors
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run lint` passes clean
- [ ] `npm run db:migrate` runs without errors and
      creates crafterhours.db with all four tables
- [ ] All four core types match CLAUDE.md definitions exactly
- [ ] All placeholder files exist with correct exports
- [ ] Directory structure matches CLAUDE.md exactly
- [ ] `.env.local.example` has all four keys