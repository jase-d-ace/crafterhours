# CrafterHours — workflow templates

---

## Template: New API route
```
## Task: New API route — [name]

### Route
[METHOD] /api/[path]

### What it does
[One sentence]

### Request
- Auth: n/a (local app, single user)
- Body/params: [describe shape]

### External calls
- Reads from SQLite: yes/no — which tables?
- Calls Claude API: yes/no
- Calls Google Calendar MCP: yes/no
- Calls GitHub MCP: yes/no

### Response
- Success [status]: [shape]
- Error cases: [list with { error, code } format]

### Reference
Match the pattern in: [existing route]

### Done criteria
- [ ] Returns correct response shape
- [ ] All errors return { error, code }
- [ ] TypeScript compiles clean
- [ ] ESLint passes
```

---

## Template: New React component
```
## Task: New component — [ComponentName]

### What it renders
[One sentence]

### Location
`components/[ComponentName]/[ComponentName].tsx`

### Props interface
[Paste TypeScript interface]

### Behavior
- Default state: [what it shows]
- Loading state: [if async data]
- Empty state: [if list/history]
- Interactions: [what user can do]

### Conversational UI note
If this component involves the Chat or planning flow,
it must support streaming responses from the Claude API —
render tokens as they arrive, do not wait for full response.

### Done criteria
- [ ] All states render correctly
- [ ] Streaming works if applicable
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Works at 375px and 1280px
```

---

## Template: New database query
```
## Task: Database query — [what it fetches or writes]

### Operation
READ | WRITE | BOTH

### Tables involved
[List tables]

### Function signature
[TypeScript function signature with param and return types]

### Query logic
[Describe what it needs to do — joins, filters, ordering]

### Location
Add to: lib/db.ts

### Edge cases to handle
- [Empty results]
- [Null fields]
- [Other]

### Done criteria
- [ ] Function exported from lib/db.ts
- [ ] Handles all edge cases listed above
- [ ] TypeScript compiles clean
- [ ] No raw SQL injection vectors
```

---

## Template: Prompt iteration
```
## Task: Prompt iteration — [which agent, what change]

### Which agent
recommendation | planning | artifact-generation | hobby-coach

### Current behavior
[What it says now, what's wrong or missing]

### Desired behavior
[Exactly what we want — tone, structure, length, what it
asks, what it produces]

### Hobby context
[Which hobby or hobbies does this affect]

### Test conversations
[Write out 2–3 example exchanges showing desired behavior]

### Done criteria
- [ ] Prompt updated in lib/claude.ts
- [ ] Output matches expected shape/types
- [ ] Tested against examples above
- [ ] TypeScript compiles clean
```

---

## Template: Hobby coach behavior
```
## Task: Hobby coach — [hobby name]

### What this coach should do differently
[How this hobby's planning conversation differs from others]

### Session plan structure for this hobby
[What PlanItems look like — warmup, main focus, cooldown]

### Artifact type and format
journal | practice_log | coding_summary
[Describe what the generated markdown should contain]

### Prompt additions needed in lib/claude.ts
[Describe the hobby-specific system prompt additions]

### Done criteria
- [ ] Planning conversation feels appropriate for this hobby
- [ ] SessionPlan structure matches the hobby's natural rhythm
- [ ] Artifact generates correctly and saves to DB
- [ ] TypeScript compiles clean
```