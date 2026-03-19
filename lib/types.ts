export type Hobby = {
  id: string
  name: string
  emoji: string
  goal: string
  focusAreas: string[]
  active: boolean
  createdAt: string
}

export type Recommendation = {
  hobby: Hobby
  reasoning: string
  confidence: number
  alternativeHobby?: Hobby
  calendarContext?: string
  githubContext?: string
  lastSession?: string
}

export type SessionPlan = {
  hobbyId: string
  duration: number
  structure: PlanItem[]
  intention: string
}

export type PlanItem = {
  title: string
  description: string
  durationMinutes: number
  type: 'warmup' | 'main' | 'cooldown' | 'reflection'
}

export type Artifact = {
  id: string
  sessionId: string
  hobbyId: string
  type: 'journal' | 'practice_log' | 'coding_summary'
  content: string
  createdAt: string
}

export type Message = {
  role: 'user' | 'assistant'
  content: string
}

export type SessionPhase =
  | 'idle'
  | 'recommending'
  | 'recommended'
  | 'redirecting'
  | 'planning'
  | 'plan_presented'
  | 'confirmed'
