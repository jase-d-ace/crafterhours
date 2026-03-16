import type { Hobby, Artifact } from './types'

class NotImplementedError extends Error {
  constructor(method: string) {
    super(`${method} is not yet implemented`)
    this.name = 'NotImplementedError'
  }
}

export type Session = {
  id: string
  hobbyId: string
  duration: number
  notes: string
  artifactType: Artifact['type']
  createdAt: string
}

export function getHobbies(): Hobby[] {
  throw new NotImplementedError('getHobbies')
}

export function getRecentSessions(): Session[] {
  throw new NotImplementedError('getRecentSessions')
}

export function saveSession(_session: Omit<Session, 'id' | 'createdAt'>): Session {
  throw new NotImplementedError('saveSession')
}

export function saveArtifact(_artifact: Omit<Artifact, 'id' | 'createdAt'>): Artifact {
  throw new NotImplementedError('saveArtifact')
}

export { type Hobby, type Artifact } from './types'
export { type Recommendation, type SessionPlan, type PlanItem } from './types'
