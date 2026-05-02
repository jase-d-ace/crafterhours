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
  goal: string
  duration: number
  phase: 'warmup' | 'main' | 'cooldown' | 'reflection'
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

export type Session = {
  id: string
  hobbyId: string
  duration: number
  notes: string
  artifactType: Artifact['type']
  createdAt: string
}

export type SaveSessionInput = Omit<Session, 'id' | 'createdAt'>
export type SaveArtifactInput = Omit<Artifact, 'id' | 'createdAt'>

export type SessionDetail = Session & {
  hobby: Hobby
  artifact: Artifact | null
}

export type SessionPhase =
  | 'idle'
  | 'recommending'
  | 'recommended'
  | 'redirecting'
  | 'planning'
  | 'plan_presented'
  | 'session_active'
  | 'logging'
  | 'artifact_preview'
  | 'completed'

export type SessionState = {
  id: string
  hobbyId: string
  status: 'planning' | 'confirmed' | 'abandoned' | 'completed'
  messages: Message[]
  sessionPlan: SessionPlan | null
  createdAt: string
  updatedAt: string
}
