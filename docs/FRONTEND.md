# CrafterHours — Frontend

## Session Planning UI

### Overview

The planning UI implements checkpoints 1–4 of the evening session flow as a single-page experience. The user sees a hobby recommendation, confirms or redirects, has a short streaming chat conversation with Claude to plan the session, reviews and approves the plan, then lands on a "session in progress" holding state. The entire flow lives in `app/page.tsx` and is driven by a `SessionPhase` state machine.

### State machine

The `SessionPhase` type (`lib/types.ts`) defines seven states:

```
idle → recommending → recommended → redirecting → planning → plan_presented → confirmed
```

| Phase | What the user sees | Transition trigger |
|-------|---|---|
| `idle` | Nothing (brief) | Auto on mount |
| `recommending` | Skeleton card with pulse animation | Recommendation response received |
| `recommended` | RecommendationCard with hobby, reasoning, context | "Let's go" or "Actually, I'd rather..." |
| `redirecting` | Alternative hobbies as HobbyCards | User picks one |
| `planning` | Chat interface with streaming | Claude's response contains a SessionPlan JSON block |
| `plan_presented` | Faded chat + SessionPlan card with approve/edit | User approves |
| `confirmed` | Centered hobby emoji, intention, plan, disabled "Finish session" button | End of current scope |

Constraints enforced:
- One redirect max (after picking an alternative, planning starts immediately)
- One plan edit max (after requesting a change, the edit button disappears)

### Hooks

#### `useSession` (`hooks/useSession.ts`)

Orchestrates the full phase state machine. Contains a single `useEffect` for the initial recommendation fetch on mount. All other phase transitions happen inside event handler callbacks — no effects watching state changes.

Key design: `handleSendMessage` awaits the streaming response, then checks the completed message for a SessionPlan JSON block. If found, it transitions to `plan_presented`. This avoids a `useEffect` watching the messages array.

Derived state (e.g. `alternatives` = all hobbies minus the recommended one) is computed inline, not synced via effect.

#### `useStreamingChat` (`hooks/useStreamingChat.ts`)

Manages `messages: Message[]` and `isStreaming: boolean`. The `sendMessage` function:

1. Appends the user message to state
2. POSTs to `/api/plan/message`
3. Reads the response body as a raw `ReadableStream` using `getReader()` + `TextDecoder`
4. Progressively updates the last message in state with accumulated chunks
5. Returns the full completed response string (used by `useSession` for plan extraction)

Not SSE — the backend writes plain text chunks. The hook reads them directly.

### Components

#### `AppHeader` (`components/AppHeader.tsx`)
Fixed header, 56px tall, backdrop blur. "CrafterHours" title left, nav links right (Session, History, Settings). Active link uses craft-pink accent. Uses `usePathname()` for active detection.

#### `RecommendationCard` (`components/RecommendationCard/`)
Displays the recommended hobby with emoji, name, goal, reasoning text, and optional context badges (calendar, GitHub, last session date). Confidence shown as a subtle progress bar. Two action buttons: "Let's go" (primary, craft-blue) and "Actually, I'd rather..." (secondary, text-only).

#### `Chat` (`components/Chat/Chat.tsx`)
Container that renders a `ChatMessage` list with a `ChatInput` pinned at bottom. Auto-scrolls on new messages via `useEffect` + `scrollIntoView` (legitimate DOM sync). Shows a typing indicator (three animated dots) when streaming and the last message is from the user (i.e. before the first assistant token arrives).

#### `ChatMessage` (`components/Chat/ChatMessage.tsx`)
Assistant messages: left-aligned, craft-blue background, max 80% width.
User messages: right-aligned, craft-gray background, max 80% width.
Both use `rounded-2xl` and `whitespace-pre-wrap`.

#### `ChatInput` (`components/Chat/ChatInput.tsx`)
Auto-resize textarea (max 4 lines before scrolling). Height adjusted via `onInput` event handler, not `useEffect`. Enter sends, Shift+Enter adds newline. Disabled during streaming with "Thinking..." placeholder. Send button with arrow icon.

#### `SessionPlan` (`components/SessionPlan/SessionPlan.tsx`)
Renders the plan intention, duration, and a list of PlanItem cards. Each item shows a color-coded type badge (warmup=amber, main=blue, cooldown=emerald, reflection=purple), title, description, and duration. When `editable` is true, shows "Looks good" and "One change..." buttons.

#### `HobbyCard` (`components/HobbyCard/HobbyCard.tsx`)
Displays hobby emoji, name, goal snippet, and optional last session date. Styled as a button — when `onClick` is provided, shows hover/focus states with craft-pink border accent. Used in the redirect flow.

### Design system

#### Colors (`tailwind.config.ts`)
Three color families, each with 50–950 shades:
- `craft-blue` — anchored on `#CCF6FF`. Assistant messages, primary buttons, confidence bar.
- `craft-gray` — anchored on `#F5F5F8`. Backgrounds, surfaces, user messages, text hierarchy.
- `craft-pink` — anchored on `#FF58DE`. Focus rings, active nav links, hobby card hover borders.

#### Dark mode
Dark mode is the default and primary experience (`darkMode: 'class'`, `class="dark"` on `<html>`). Light mode color mappings exist in component styles but dark is the designed-for path. This is an evening app.

#### Layout
Single-column, centered at `max-w-[640px]`. Full viewport height minus header. Chat input pinned to bottom of content area. 375px minimum width supported.

### SessionPlan extraction

Claude's system prompts instruct it to include a fenced ` ```json ` code block containing the SessionPlan object in its final planning message. The frontend extraction logic (`extractSessionPlan` in `useSession.ts`):

1. Regex matches the first ` ```json...``` ` block in the assistant's response
2. Parses as JSON
3. Validates required fields: `hobbyId` (string), `duration` (number), `intention` (string), `structure` (non-empty array)
4. If valid, transitions to `plan_presented`
5. If parsing fails or fields are missing, stays in `planning` (user can keep chatting)

The raw message content including the JSON block is displayed to the user in the faded chat view. A future improvement would strip the JSON block before display.

### Animations

CSS keyframe animations defined in `app/globals.css`:
- `animate-fade-in` — opacity 0→1, 300ms ease-out
- `animate-slide-up` — translateY(16px)→0 + fade, 300ms ease-out
- `animate-pulse-skeleton` — opacity pulse between 0.4 and 0.7, 1.5s loop
- `animate-typing-dot` — bounce + opacity pulse, 1.2s loop with staggered delays

Phase transitions use these classes directly on rendered elements. HobbyCards in the redirect flow use staggered `animationDelay` for a cascade effect.

### Design decisions

- **Avoid `useEffect`.** All side effects triggered by user actions flow through event handler callbacks. Only two `useEffect` calls exist in the entire frontend: initial recommendation fetch (mount) and chat auto-scroll (DOM sync). This makes data flow easier to trace and avoids the common pitfalls of effect chains.
- **Event handlers return data for downstream logic.** `sendMessage` returns the completed response string so `handleSendMessage` can extract the plan inline — no need for an effect watching the messages array.
- **No client-side routing for the main flow.** The entire recommend → plan → confirm flow happens on a single page via state machine, not via URL changes. This keeps the experience feeling like a conversation, not a multi-step form.
- **Mock recommend, real plan.** The recommendation endpoint returns mock data because the real recommender depends on MCP integrations. The plan endpoints hit real Claude API — the chat is live, not simulated.
- **One redirect, one edit.** Hard limits enforced in the state machine. These match the CLAUDE.md spec and keep the UX from becoming a negotiation loop.

### Technical limitations

- **No session persistence on refresh.** The `sessionId` lives in React state. Refreshing the page loses the planning conversation and starts over from recommendation. The backend `GET /api/plan/session` endpoint exists but isn't used for restoration yet.
- **JSON block visible in chat.** When Claude returns the SessionPlan JSON in its final message, the raw block is visible in the faded chat view during `plan_presented`. Should be stripped before display.
- **No error UI.** API failures (network errors, Claude API errors) are silently swallowed. No error states, no retry buttons, no toast notifications. Acceptable for local dev but needs handling before the app is daily-driveable.
- **No mobile safe area insets.** The spec calls for iOS safe area handling on the bottom-pinned input, but this isn't implemented yet.
- **Skeleton → recommendation transition is a hard cut.** The spec calls for a crossfade between skeleton and RecommendationCard, but the current implementation just swaps them with a fade-in on the card. Close enough for now.

### React patterns

- Avoid `useEffect` for anything triggered by user actions
- Prefer `useCallback` for handler stability
- Prefer computed/derived values over effect + setState
- `useEffect` only for DOM sync (scroll) and mount-time data fetching
- All components that use hooks or browser APIs are marked `'use client'`
