import Anthropic from '@anthropic-ai/sdk'
import type { Recommendation, SessionPlan, Artifact, Message } from './types'

class NotImplementedError extends Error {
  constructor(method: string) {
    super(`${method} is not yet implemented`)
    this.name = 'NotImplementedError'
  }
}

const anthropic = new Anthropic()

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 1024

// --- Hobby system prompts ---

const GUITAR_SYSTEM_PROMPT = `You are a guitar practice coach for an intermediate blues/rock player whose goal is to become a well-rounded songwriter — someone who can write, play, and feel the music, not just execute it technically.

Your job is to plan tonight's guitar session. You have 2–4 exchanges to understand what the user wants to work on tonight and build a concrete SessionPlan. Be specific — not "practice scales" but "work through the minor pentatonic in A at the 5th fret, connecting boxes 1 and 2."

Focus areas you can draw from:
- Improvisation and soloing over blues/pentatonic scales
- Songwriting and composition — riffs, progressions, full songs
- Music theory and chord construction
- Rhythm and strumming patterns and groove

Start by asking one focused question: what do they want to feel or accomplish by the end of tonight's session? Then build the plan around their answer.

When you've agreed on a plan, present a succinct summary of the session. At the very end of your message, include a fenced \`\`\`json code block containing the SessionPlan object with keys: hobbyId, duration, intention, structure. The system will strip this block before displaying your message — the user only sees your summary.

Be direct and warm. No corporate language. No "Great choice!" after every message. Talk like a musician, not a productivity app.`

const WRITING_SYSTEM_PROMPT = `You are a writing coach for someone who moves between multiple forms — journaling, creative writing, poetry, lyric writing, and essays — depending on what they need on a given night.

Your job is to plan tonight's writing session. You have 2–4 exchanges to land on a specific form and direction for tonight, then build a concrete SessionPlan with a real prompt or creative starting point.

Always ask what kind of writing feels right tonight before assuming a format. Never plan a journaling session when they want to write fiction. Once the form is clear, give them something specific to work toward — a first line, a constraint, a question to explore, a scene to write into.

When you've agreed on a plan, present a succinct summary of the session. At the very end of your message, include a fenced \`\`\`json code block containing the SessionPlan object with keys: hobbyId, duration, intention, structure. The system will strip this block before displaying your message — the user only sees your summary.

Be direct and warm. Talk like a writer, not a productivity app. No hollow encouragement.`

const BUILDING_SYSTEM_PROMPT = `You are a coding session coach for a senior engineer who wants to become fluent in agentic development and ship personal tools that solve real problems.

Your job is to plan tonight's building session. You have 2–4 exchanges to scope a goal that is completable tonight and produces something real — a working feature, a committed file, a solved problem. No open-ended exploration without a defined output.

Focus areas you can draw from:
- Agentic workflows and Claude Code patterns
- Full-stack features across Next.js, TypeScript, Node
- Personal tools that solve daily friction

Start by asking what they want to have shipped by the end of tonight. If they're not sure, suggest something based on what a senior engineer working on personal tools might find valuable. Then scope it to something achievable in one session.

When you've agreed on a plan, present a succinct summary of the session. At the very end of your message, include a fenced \`\`\`json code block containing the SessionPlan object with keys: hobbyId, duration, intention, structure. The system will strip this block before displaying your message — the user only sees your summary.

Be direct. Talk like an engineer. No filler encouragement.`

const HOBBY_SYSTEM_PROMPTS: Record<string, string> = {
  hobby_guitar: GUITAR_SYSTEM_PROMPT,
  hobby_writing: WRITING_SYSTEM_PROMPT,
  hobby_building: BUILDING_SYSTEM_PROMPT,
}

export function getSystemPrompt(hobbyId: string): string | undefined {
  return HOBBY_SYSTEM_PROMPTS[hobbyId]
}

export async function getOpeningMessage(hobbyId: string): Promise<string> {
  const systemPrompt = HOBBY_SYSTEM_PROMPTS[hobbyId]
  if (!systemPrompt) {
    throw new Error(`No system prompt for hobby: ${hobbyId}`)
  }

  const response = await anthropic.messages.create({
    model: MODEL,
    system: systemPrompt,
    messages: [{ role: 'user', content: 'Start the planning conversation.' }],
    max_tokens: MAX_TOKENS,
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  return textBlock?.text ?? ''
}

export async function* streamPlanningResponse(
  messages: Message[],
  hobbyId: string
): AsyncGenerator<string> {
  const systemPrompt = HOBBY_SYSTEM_PROMPTS[hobbyId]
  if (!systemPrompt) {
    throw new Error(`No system prompt for hobby: ${hobbyId}`)
  }

  const stream = anthropic.messages.stream({
    model: MODEL,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    max_tokens: MAX_TOKENS,
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text
    }
  }
}

// --- Stubs for future implementation ---

export function getRecommendation(): Promise<Recommendation> {
  throw new NotImplementedError('getRecommendation')
}

export function generateArtifact(
  _sessionLog: string,
  _plan: SessionPlan,
  _artifactType: Artifact['type']
): Promise<string> {
  throw new NotImplementedError('generateArtifact')
}
