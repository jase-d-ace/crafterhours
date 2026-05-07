import { NextResponse } from 'next/server'
import { getRecentSessions, saveSession, getSession } from '@/lib/db'
import type { Artifact } from '@/lib/types'

const ARTIFACT_TYPES: Record<string, Artifact['type']> = {
  hobby_guitar: 'practice_log',
  hobby_writing: 'journal',
  hobby_building: 'coding_summary',
}

export async function GET() {
  const sessions = getRecentSessions(10)
  return NextResponse.json({ sessions })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { sessionId, actualDuration, notes, artifactType } = body

  if (!sessionId || actualDuration == null || !notes || !artifactType) {
    return NextResponse.json(
      { error: 'sessionId, actualDuration, notes, and artifactType required', code: 'MISSING_FIELDS' },
      { status: 400 }
    )
  }

  const sessionState = getSession(sessionId)
  if (!sessionState) {
    return NextResponse.json(
      { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
      { status: 404 }
    )
  }

  if (sessionState.status !== 'confirmed') {
    return NextResponse.json(
      { error: 'Session is not in confirmed state', code: 'INVALID_SESSION_STATE' },
      { status: 409 }
    )
  }

  const resolvedArtifactType: Artifact['type'] =
    ARTIFACT_TYPES[sessionState.hobbyId] ?? artifactType

  const session = saveSession({
    hobbyId: sessionState.hobbyId,
    duration: Math.max(1, Math.round(actualDuration)),
    notes,
    artifactType: resolvedArtifactType,
  })

  return NextResponse.json({ session })
}
