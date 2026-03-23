## Task: Planning UI

### Goal
Implement the frontend for the evening session planning flow —
checkpoints 1–4 from the agent interaction model: recommendation,
confirm/redirect, planning conversation, and plan confirmation.
The experience should feel like a short chat exchange, not a
multi-step form. Once planning is complete, there should be a
smooth animated transition to a "session active" holding state.

### Scope
**In scope:**
- Recommend → Confirm/Redirect → Planning chat → Plan confirmed
- "Session active" holding state after confirmation (placeholder
  for checkpoints 5–7)
- Design system foundation (color palette, dark mode, layout)
- Mock API implementations for all endpoints

**Not in scope:**
- Session timer logic
- Session logging (checkpoint 6)
- Artifact generation/preview (checkpoint 7)
- Settings page UI
- History page UI
- Real Claude API calls or MCP integrations
- Real database queries

### Design system

#### Base colors
- Primary: `#CCF6FF` — used for interactive elements, assistant
  messages, primary actions
- Structural: `#F5F5F8` — used for text, backgrounds, surfaces
- Accent: `#FF58DE` — used for highlights, focus states, hobby
  emoji glow

#### Color families
Generate three Tailwind color families in `tailwind.config.ts`,
each with 50–900 shades:
- `craft-blue` — anchored on `#CCF6FF`
- `craft-gray` — anchored on `#F5F5F8`
- `craft-pink` — anchored on `#FF58DE`

#### Dark mode default
This is an evening app — dark mode is the primary experience.
- Set `darkMode: 'class'` in `tailwind.config.ts`
- Add `class="dark"` to `<html>` in `app/layout.tsx`
- Also construct a light mode color system for completeness

#### Element-to-color mapping
| Element                     | Color guidance                          |
|-----------------------------|-----------------------------------------|
| Page background             | Darkest craft-gray                      |
| Card/surface backgrounds    | Near-darkest craft-gray                 |
| Primary text                | Lightest craft-gray                     |
| Secondary/muted text        | Mid craft-gray                          |
| Assistant message bubbles   | Light craft-blue bg, dark text          |
| User message bubbles        | Dark craft-gray bg, light text          |
| Primary buttons             | Mid craft-blue bg, white text           |
| Accent/highlight/focus rings| Craft-pink mid shade                    |
| Hobby emoji glow/highlight  | Craft-pink                              |

#### Conventions
- Border radius: `rounded-xl` (cards), `rounded-2xl` (message
  bubbles), `rounded-lg` (buttons)
- System font stack (Next.js default)

---

### Layout

#### AppShell header
- "CrafterHours" title on the left, nav links on the right
  (Session, History, Settings)
- 48–56px tall, semi-transparent with backdrop blur
- Near-darkest craft-gray background
- Active page link indicated with accent color

#### Main content area
- Centered, `max-w-[640px]`, full viewport height minus header
- Chat input pinned to bottom of content area
- Single-column layout at all breakpoints

#### Mobile
- 375px minimum width
- Safe area insets on iOS for bottom-pinned input
- `sm:` breakpoint (640px) for centering the content area

---

### State machine
Add a `SessionPhase` type to `lib/types.ts` and manage state
via a custom `hooks/useSession.ts` hook:

| State            | UI                                      | Trigger to next                          |
|------------------|-----------------------------------------|------------------------------------------|
| `idle`           | Brief loading moment                    | Auto-fetch recommendation on mount       |
| `recommending`   | Skeleton/pulse animation on hobby area  | Recommendation response received         |
| `recommended`    | RecommendationCard with hobby, reasoning, context. Two buttons: "Let's go" / "Actually, I'd rather..." | User clicks confirm or redirect |
| `redirecting`    | Alternative hobbies as HobbyCards. One redirect max — after picking, go straight to planning | User picks alternative hobby |
| `planning`       | Chat interface. Opening message from plan/start. User types, assistant streams. 2–4 exchanges | Agent's final message contains a SessionPlan JSON code block |
| `plan_presented` | SessionPlan component renders below chat. Two buttons: "Looks good" / "One change..." One edit max | User approves plan |
| `confirmed`      | Chat collapses/fades. SessionPlan stays visible. "Session in progress" holding state with hobby emoji and intention. "Finish session" button (disabled/placeholder) | (End of this task's scope) |

---

### Component specifications

#### New components to create

**`components/RecommendationCard/RecommendationCard.tsx`**
- Props: `recommendation: Recommendation`, `onConfirm: () => void`,
  `onRedirect: () => void`
- Displays: hobby emoji + name, reasoning text,
  calendarContext/githubContext if present, lastSession date if
  present, confidence as a subtle visual indicator
- Two action buttons: "Let's go" (primary) and "Actually, I'd
  rather..." (secondary/text)

**`components/Chat/ChatMessage.tsx`**
- Props: `message: Message`
- Assistant messages: left-aligned, craft-blue bg, max-w-[80%]
- User messages: right-aligned, craft-gray bg, max-w-[80%]
- No avatars — it's a two-person conversation

**`components/Chat/ChatInput.tsx`**
- Props: `onSend: (message: string) => void`, `disabled: boolean`
- Auto-resize textarea (max 4 lines before scrolling)
- Send on Enter, Shift+Enter for newline
- Visible send button
- When disabled: dimmed appearance, placeholder "Thinking..."

#### Implement existing placeholders

**`components/Chat/Chat.tsx`**
- Props: `messages: Message[]`, `onSend: (message: string) => void`,
  `isStreaming: boolean`
- Renders ChatMessage list with auto-scroll to bottom on new
  messages
- Renders ChatInput pinned at bottom
- When streaming, shows typing indicator (three dots) in
  assistant bubble before first token arrives

**`components/SessionPlan/SessionPlan.tsx`**
- Props: `plan: SessionPlan`, `onApprove: () => void`,
  `onRequestEdit: () => void`, `editable: boolean`
- Renders intention text at top
- Renders PlanItem cards with type badge (warmup / main /
  cooldown / reflection), title, description, duration in minutes
- Approve + "One change..." buttons when `editable` is true

**`components/HobbyCard/HobbyCard.tsx`**
- Props: `hobby: Hobby`, `lastSession?: string`,
  `onClick?: () => void`
- Shows emoji, name, goal snippet, last session date
- Clickable when onClick is provided (used during redirect flow)

---

### Chat UX & streaming

#### Stream consumption
- Use `fetch` + `ReadableStream` reader (POST endpoint, not
  EventSource)
- Custom hook `hooks/useStreamingChat.ts`:
  - Manages `messages: Message[]` state
  - `sendMessage(text)` → appends user message, calls
    `/api/plan/message`, reads stream, appends tokens to
    current assistant message progressively
  - Exposes `isStreaming: boolean`
  - Exposes `messages: Message[]`

#### Input behavior
- Input disabled during streaming, re-enables when complete
- No loading spinner during streaming — appearing text IS the
  loading indicator
- Before first token arrives, show a brief typing indicator
  (three animated dots) in the assistant bubble

#### Message rendering
- Messages render as styled bubbles (see ChatMessage spec above)
- Chat auto-scrolls to bottom as tokens arrive
- Send on Enter, Shift+Enter for newline

---

### SessionPlan extraction
The mock plan endpoint's final response (after 2–3 exchanges)
should include a fenced JSON code block with the SessionPlan
structure:

```json
{
  "hobbyId": "hobby_guitar",
  "duration": 60,
  "intention": "...",
  "structure": [...]
}
```

The frontend:
1. Checks the last assistant message for a fenced ```json block
2. Parses it into a `SessionPlan` object
3. If valid, transitions to `plan_presented` state
4. If parsing fails, stays in `planning` state (user can
   continue the conversation)
5. The parsed plan is sent to `POST /api/plan/confirm` when
   the user approves

---

### Transition animations

| Transition                            | Animation                                                                 |
|---------------------------------------|---------------------------------------------------------------------------|
| `idle` → `recommending`              | Skeleton cards fade in (opacity 0→1, 300ms ease-out)                      |
| `recommending` → `recommended`       | Skeleton crossfades to RecommendationCard (opacity swap, 400ms ease)      |
| `recommended` → `redirecting`        | RecommendationCard slides up and fades out, alternative HobbyCards stagger in from below (each 100ms delay, 300ms slide-up + fade-in) |
| `recommended`/`redirecting` → `planning` | Recommendation area compresses upward (height collapse 400ms ease), chat area expands from below (slide-up 400ms ease, 100ms delay after collapse starts) |
| `planning` → `plan_presented`        | SessionPlan card slides in from bottom (translateY 300ms ease-out), chat scrolls up to make room |
| `plan_presented` → `confirmed`       | Chat messages fade to 50% opacity (300ms), plan card slides to center (300ms), "Session in progress" state fades in (200ms delay, 300ms fade-in) |

General: all interactive elements have hover/active transitions
(150ms). Focus rings use craft-pink with 200ms transition.

---

### API integration
All API requests should be made in accordance with Next.js best
practices. The mock routes must return the exact response shapes
defined in PLAN_ENDPOINT.md so the frontend doesn't change when
real implementations land:

**`GET /api/recommend`**
Response: `{ recommendation: Recommendation }`

**`POST /api/plan/start`**
Request: `{ hobbyId: string }`
Response: `{ sessionId: string, hobbyId: string, openingMessage: string }`

**`POST /api/plan/message`**
Request: `{ sessionId: string, message: string }`
Response: `text/event-stream` (ReadableStream of text tokens)

**`GET /api/plan/session?sessionId=uuid`**
Response: `{ sessionId, hobbyId, status, messages, sessionPlan }`

**`POST /api/plan/confirm`**
Request: `{ sessionId: string, sessionPlan: SessionPlan }`
Response: `{ sessionId, status: 'confirmed', sessionPlan }`

**`POST /api/plan/abandon`**
Request: `{ sessionId: string }`
Response: `{ sessionId, status: 'abandoned' }`

---

### Files to create or modify

**Create:**
- `lib/mocks/recommend.ts`
- `lib/mocks/plan.ts`
- `hooks/useSession.ts`
- `hooks/useStreamingChat.ts`
- `components/RecommendationCard/RecommendationCard.tsx`
- `components/Chat/ChatMessage.tsx`
- `components/Chat/ChatInput.tsx`
- `app/api/plan/start/route.ts`
- `app/api/plan/message/route.ts`
- `app/api/plan/session/route.ts`
- `app/api/plan/confirm/route.ts`
- `app/api/plan/abandon/route.ts`

**Modify:**
- `tailwind.config.ts` — color palette, dark mode
- `app/globals.css` — dark mode base styles
- `app/layout.tsx` — AppShell header with nav
- `app/page.tsx` — full checkpoint state machine
- `app/api/recommend/route.ts` — mock recommendation
- `components/Chat/Chat.tsx` — full implementation
- `components/SessionPlan/SessionPlan.tsx` — full implementation
- `components/HobbyCard/HobbyCard.tsx` — full implementation
- `lib/types.ts` — add `SessionPhase` type

### React patterns
- Avoid `useEffect` where possible. Prefer event handlers for
  side effects triggered by user actions (button clicks, form
  submits, message sends). Prefer `useMemo`/computed values over
  `useEffect` + `setState` for derived state. Use `useEffect`
  only for true synchronization needs (e.g. auto-scroll on new
  messages, initial data fetch on mount).

### Do NOT touch
- `lib/claude.ts` — prompt templates (per CLAUDE.md)
- `lib/github.ts`, `lib/calendar.ts` — MCP clients (per CLAUDE.md)
- `lib/migrations/` — migration files (per CLAUDE.md)
- `next.config.mjs`
- `components/ArtifactPreview/` — out of scope
- `lib/db.ts` — no real DB queries in this task (mocks only)

---

### Done criteria
- [ ] State machine transitions through all 7 states without errors
- [ ] RecommendationCard displays hobby, reasoning, and actions
- [ ] Redirect shows alternative hobbies, one redirect max enforced
- [ ] Chat renders messages with streaming (mocked)
- [ ] Input disabled during streaming, re-enables after
- [ ] SessionPlan renders with PlanItem cards, approve/edit buttons
- [ ] One edit max enforced on plan
- [ ] Confirmed state shows "session active" holding view
- [ ] Design system colors in tailwind.config.ts with dark mode
      default and light mode alternative
- [ ] Layout has header with nav links
- [ ] All transitions animated per spec table
- [ ] Mock API routes return correct response shapes matching
      PLAN_ENDPOINT.md contracts
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run lint` passes clean
- [ ] UI renders correctly at 375px and 1280px widths
