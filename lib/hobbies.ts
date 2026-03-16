export type { Hobby } from './types'

import type { Hobby } from './types'

export function getDefaultHobbies(): Hobby[] {
  return [
    {
      id: 'hobby_guitar',
      name: 'Guitar',
      emoji: '\uD83C\uDFB8',
      goal: 'become a well-rounded blues/rock songwriter who can write, play, and feel the music',
      focusAreas: [
        'improvisation and soloing over blues/pentatonic scales',
        'songwriting and composition',
        'music theory and chord construction',
        'rhythm and strumming patterns',
      ],
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hobby_writing',
      name: 'Writing',
      emoji: '\u270D\uFE0F',
      goal: 'build a consistent writing practice across multiple forms and get comfortable moving between them',
      focusAreas: [
        'raw journaling',
        'creative writing',
        'poetry and lyric writing',
        'essays and structured thinking',
      ],
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hobby_building',
      name: 'Building',
      emoji: '\uD83D\uDEE0\uFE0F',
      goal: 'become fluent in agentic development, ship personal tools, deepen full-stack skills',
      focusAreas: [
        'agentic workflows and Claude Code',
        'full-stack features and side projects',
        'personal tools for daily use',
      ],
      active: true,
      createdAt: new Date().toISOString(),
    },
  ]
}

export function isKnownHobby(hobbyId: string): boolean {
  return ['hobby_guitar', 'hobby_writing', 'hobby_building'].includes(hobbyId)
}
