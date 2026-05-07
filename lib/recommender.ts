import type { Hobby, Recommendation, Session } from './types'
import { getHobbies, getRecentSessions } from './db'
import { generateRecommendationReasoning } from './claude'

export async function buildRecommendation(): Promise<{
  recommendation: Recommendation | null
  allHobbies: Hobby[]
}> {
  const allHobbies = getHobbies()
  const sessions = getRecentSessions(50)

  if (sessions.length === 0) {
    return { recommendation: null, allHobbies }
  }

  const lastByHobby = new Map<string, Session>()
  for (const s of sessions) {
    if (!lastByHobby.has(s.hobbyId)) {
      lastByHobby.set(s.hobbyId, s)
    }
  }

  const sorted = [...allHobbies].sort((a, b) => {
    const aTime = lastByHobby.get(a.id)
      ? new Date(lastByHobby.get(a.id)!.createdAt).getTime()
      : -Infinity
    const bTime = lastByHobby.get(b.id)
      ? new Date(lastByHobby.get(b.id)!.createdAt).getTime()
      : -Infinity
    return aTime - bTime
  })

  const primary = sorted[0]
  const alternative = sorted[1]
  const lastSession = lastByHobby.get(primary.id) ?? null
  const reasoning = await generateRecommendationReasoning(primary, lastSession)

  return {
    recommendation: {
      hobby: primary,
      reasoning,
      confidence: 0.7,
      alternativeHobby: alternative,
      lastSession: lastSession?.createdAt,
    },
    allHobbies,
  }
}
