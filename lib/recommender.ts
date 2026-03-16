import type { Recommendation } from './types'

class NotImplementedError extends Error {
  constructor(method: string) {
    super(`${method} is not yet implemented`)
    this.name = 'NotImplementedError'
  }
}

export function buildRecommendation(): Promise<Recommendation> {
  throw new NotImplementedError('buildRecommendation')
}
