import type { Recommendation, Hobby } from '@/lib/types'

const guitar: Hobby = {
  id: 'hobby_guitar',
  name: 'Guitar',
  emoji: '🎸',
  goal: 'Become a well-rounded blues/rock songwriter',
  focusAreas: [
    'Improvisation and soloing over blues/pentatonic scales',
    'Songwriting and composition',
    'Music theory and chord construction',
    'Rhythm and strumming patterns',
  ],
  active: true,
  createdAt: '2026-01-15T00:00:00Z',
}

const writing: Hobby = {
  id: 'hobby_writing',
  name: 'Writing',
  emoji: '✍️',
  goal: 'Build a consistent writing practice across multiple forms',
  focusAreas: [
    'Raw journaling',
    'Creative writing',
    'Poetry and lyric writing',
    'Essays and structured thinking',
  ],
  active: true,
  createdAt: '2026-01-15T00:00:00Z',
}

const building: Hobby = {
  id: 'hobby_building',
  name: 'Building',
  emoji: '🛠️',
  goal: 'Ship personal tools and deepen agentic development fluency',
  focusAreas: [
    'Agentic workflows and Claude Code',
    'Full-stack features and side projects',
    'Personal tools for daily use',
  ],
  active: true,
  createdAt: '2026-01-15T00:00:00Z',
}

const allHobbies: Hobby[] = [guitar, writing, building]

export function getMockRecommendation(): {
  recommendation: Recommendation
  allHobbies: Hobby[]
} {
  return {
    recommendation: {
      hobby: guitar,
      reasoning:
        "It's been 5 days since your last guitar session — longest gap this month. You were working on connecting pentatonic boxes last time and left a note to pick it back up.",
      confidence: 0.85,
      alternativeHobby: writing,
      calendarContext: 'Nothing until 9am tomorrow — you have a full evening.',
      githubContext: '3 commits today on CrafterHours, building momentum.',
      lastSession: '2026-03-17T00:00:00Z',
    },
    allHobbies,
  }
}
