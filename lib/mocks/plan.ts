// TODO: replace with real implementation

import type { SessionPlan } from '@/lib/types'

type SessionState = {
  sessionId: string
  hobbyId: string
  status: 'planning' | 'confirmed' | 'abandoned'
  messages: { role: 'user' | 'assistant'; content: string }[]
  sessionPlan: SessionPlan | null
}

const sessions = new Map<string, SessionState>()

const openingMessages: Record<string, string> = {
  hobby_guitar:
    "Hey — good to have you back on the guitar. What do you want to feel or accomplish by the end of tonight's session? Could be a specific technique, a song idea you want to chase, or just a vibe you're after.",
  hobby_writing:
    "What kind of writing feels right tonight? Journaling, something creative, poetry, lyrics, an essay — what's pulling at you?",
  hobby_building:
    "What do you want to have shipped by the end of tonight? A feature, a tool, a fix — what's the thing you'd feel good about having done?",
}

const planningResponses: Record<string, string[]> = {
  hobby_guitar: [
    "Nice — connecting those pentatonic boxes is great work for building your solo vocabulary. Let me think about how to structure this.\n\nSo you want to feel more fluid moving between positions. Let's make that the focus. How much time do you have tonight? And do you want to stay purely in the pentatonic world, or should we bring in some chord theory to break it up?",
    `Good call on mixing it in. Here's what I'm thinking for tonight:

We'll start with a targeted warmup to get your fingers moving through the boxes you know, then spend the main block connecting boxes 1 and 2 in A minor pentatonic with some backing tracks. We'll close with 10 minutes of free improvisation over a slow blues to put it all together.

\`\`\`json
{
  "hobbyId": "hobby_guitar",
  "duration": 60,
  "intention": "Move fluidly between pentatonic boxes 1 and 2 in A minor over a blues progression",
  "structure": [
    {
      "title": "Pentatonic warmup",
      "description": "Run through boxes 1 and 2 individually at a comfortable tempo. Focus on clean transitions between strings, not speed.",
      "durationMinutes": 10,
      "type": "warmup"
    },
    {
      "title": "Box connection drills",
      "description": "Practice connecting boxes 1 and 2 using slide transitions at the 5th and 7th frets. Use the A minor backing track at 80 BPM. Focus on knowing where you are, not just muscle memory.",
      "durationMinutes": 25,
      "type": "main"
    },
    {
      "title": "Free improvisation",
      "description": "Slow blues in A — solo freely using both boxes. Let the music breathe. Focus on phrasing and feel over technical accuracy.",
      "durationMinutes": 15,
      "type": "main"
    },
    {
      "title": "Session reflection",
      "description": "Note which transitions felt smooth and which need more work. Pick one specific lick or phrase that clicked tonight.",
      "durationMinutes": 10,
      "type": "reflection"
    }
  ]
}
\`\`\``,
  ],
  hobby_writing: [
    "Poetry is a good instinct tonight. Any particular thread you want to pull on? A feeling, an image, a memory — or would you rather I give you a constraint to write into?",
    `Let's go with a constraint then. Here's what I'm thinking:

We'll start with a short freewrite to get the words moving, then spend the main block writing into a specific constraint — tonight I'm going to give you a form to work within. We'll finish by reading what you wrote and picking the lines that have life in them.

\`\`\`json
{
  "hobbyId": "hobby_writing",
  "duration": 45,
  "intention": "Write 2-3 constrained poems and find the lines worth keeping",
  "structure": [
    {
      "title": "Freewrite warmup",
      "description": "5 minutes, pen doesn't stop. Write about whatever is in your head right now. Don't edit, don't pause.",
      "durationMinutes": 5,
      "type": "warmup"
    },
    {
      "title": "Constrained writing: 10-line poems",
      "description": "Write 2-3 poems, each exactly 10 lines. Constraint: every poem must contain one color and one sound. No titles — let the poem stand alone.",
      "durationMinutes": 25,
      "type": "main"
    },
    {
      "title": "Read and harvest",
      "description": "Read everything aloud. Circle or highlight the lines that surprise you — the ones that feel more alive than you expected. Note why they work.",
      "durationMinutes": 15,
      "type": "reflection"
    }
  ]
}
\`\`\``,
  ],
  hobby_building: [
    "Solid — scoping a clear deliverable is key. What part of the app are you looking at? Is this greenfield or are you building on something that already exists? Give me a sense of the stack and what 'done' looks like tonight.",
    `Alright, that's well-scoped. Here's the plan:

We'll start with a quick review of what's already in place, then spend the main block implementing the core feature. We'll wrap up by testing it end-to-end and making a clean commit.

\`\`\`json
{
  "hobbyId": "hobby_building",
  "duration": 90,
  "intention": "Ship a working feature with a clean commit by end of session",
  "structure": [
    {
      "title": "Codebase review",
      "description": "Spend 10 minutes reading the relevant files and understanding the current state. No coding yet — just orientation.",
      "durationMinutes": 10,
      "type": "warmup"
    },
    {
      "title": "Core implementation",
      "description": "Build the main feature. Focus on getting it working end-to-end before polishing. Ship ugly, then clean up.",
      "durationMinutes": 50,
      "type": "main"
    },
    {
      "title": "Testing and cleanup",
      "description": "Test the feature manually. Fix any obvious issues. Clean up the code enough to commit without embarrassment.",
      "durationMinutes": 20,
      "type": "main"
    },
    {
      "title": "Commit and reflect",
      "description": "Make a clean commit with a good message. Note what's left for next session and any decisions you want to revisit.",
      "durationMinutes": 10,
      "type": "reflection"
    }
  ]
}
\`\`\``,
  ],
}

export function mockStartSession(hobbyId: string): {
  sessionId: string
  hobbyId: string
  openingMessage: string
} {
  const sessionId = crypto.randomUUID()
  const openingMessage =
    openingMessages[hobbyId] || "Tell me about this hobby — what does a productive session look like for you?"

  sessions.set(sessionId, {
    sessionId,
    hobbyId,
    status: 'planning',
    messages: [{ role: 'assistant', content: openingMessage }],
    sessionPlan: null,
  })

  return { sessionId, hobbyId, openingMessage }
}

export async function* mockSendMessage(
  sessionId: string,
  message: string,
  _messageCount: number
): AsyncGenerator<string> {
  const session = sessions.get(sessionId)
  if (!session) throw new Error('Session not found')

  session.messages.push({ role: 'user', content: message })

  const responses = planningResponses[session.hobbyId] || planningResponses['hobby_guitar']
  // Use assistant message count to determine which response to give
  const assistantCount = session.messages.filter(m => m.role === 'assistant').length
  const responseIndex = Math.min(assistantCount, responses.length - 1)
  const fullResponse = responses[responseIndex]

  // Simulate streaming by yielding small chunks with delays
  const words = fullResponse.split(' ')
  for (let i = 0; i < words.length; i++) {
    const chunk = (i === 0 ? '' : ' ') + words[i]
    yield chunk
    await new Promise(resolve => setTimeout(resolve, 30))
  }

  session.messages.push({ role: 'assistant', content: fullResponse })
}

export function mockConfirmPlan(
  sessionId: string,
  plan: SessionPlan
): { sessionId: string; status: 'confirmed'; sessionPlan: SessionPlan } {
  const session = sessions.get(sessionId)
  if (!session) throw new Error('Session not found')

  session.status = 'confirmed'
  session.sessionPlan = plan

  return { sessionId, status: 'confirmed', sessionPlan: plan }
}

export function mockGetSession(sessionId: string): SessionState | undefined {
  return sessions.get(sessionId)
}

export function mockAbandonSession(
  sessionId: string
): { sessionId: string; status: 'abandoned' } {
  const session = sessions.get(sessionId)
  if (!session) throw new Error('Session not found')

  session.status = 'abandoned'
  return { sessionId, status: 'abandoned' }
}
