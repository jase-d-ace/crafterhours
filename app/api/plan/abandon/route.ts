import { NextResponse } from 'next/server'
import { getSession, updateSessionStatus } from '@/lib/db'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { sessionId } = body

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId required', code: 'MISSING_SESSION_ID' },
      { status: 400 }
    )
  }

  const session = getSession(sessionId)
  if (!session) {
    return NextResponse.json(
      { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
      { status: 404 }
    )
  }

  if (session.status !== 'planning') {
    return NextResponse.json(
      { error: 'Session is already finalized', code: 'INVALID_SESSION_STATE' },
      { status: 409 }
    )
  }

  updateSessionStatus(sessionId, 'abandoned')

  return NextResponse.json({
    sessionId,
    status: 'abandoned',
  })
}
