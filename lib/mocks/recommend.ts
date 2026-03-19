// TODO: replace with real implementation

import { getDefaultHobbies } from '@/lib/hobbies'
import type { Recommendation } from '@/lib/types'

export function getMockRecommendation(): Recommendation {
  const hobbies = getDefaultHobbies()
  const guitar = hobbies.find(h => h.id === 'hobby_guitar')!
  const writing = hobbies.find(h => h.id === 'hobby_writing')!

  return {
    hobby: guitar,
    reasoning:
      "It's been five days since your last guitar session, and you were working on connecting pentatonic boxes last time. Your calendar is clear tonight — no early morning tomorrow. Good night to pick the guitar back up.",
    confidence: 0.85,
    alternativeHobby: writing,
    calendarContext: 'Nothing until 10am tomorrow — you have a full evening.',
    githubContext: 'Three commits today on CrafterHours. Building energy is high, but variety matters.',
    lastSession: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  }
}
