import type { Recommendation, SessionPlan, Artifact, Message } from './types'

class NotImplementedError extends Error {
  constructor(method: string) {
    super(`${method} is not yet implemented`)
    this.name = 'NotImplementedError'
  }
}

export function getRecommendation(): Promise<Recommendation> {
  throw new NotImplementedError('getRecommendation')
}

export function conductPlanningConversation(
  _messages: Message[],
  _hobbyId: string
): Promise<string> {
  throw new NotImplementedError('conductPlanningConversation')
}

export function generateArtifact(
  _sessionLog: string,
  _plan: SessionPlan,
  _artifactType: Artifact['type']
): Promise<string> {
  throw new NotImplementedError('generateArtifact')
}
