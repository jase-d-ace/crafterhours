import { NextResponse } from 'next/server'
import { mockGetSession } from '@/lib/mocks/plan'
import { logger, serializeError } from '@/lib/logger'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId required', code: 'MISSING_SESSION_ID' },
      { status: 400 }
    )
  }

  try {
    // TODO: replace with real implementation
    const session = mockGetSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      sessionId: session.sessionId,
      hobbyId: session.hobbyId,
      status: session.status,
      messages: session.messages,
      sessionPlan: session.sessionPlan,
    })
  } catch (e) {
    logger.error('api/plan/session', 'Failed to get session', {
      code: 'INTERNAL_ERROR',
      sessionId,
      ...serializeError(e),
    })
    return NextResponse.json(
      { error: 'Failed to get session', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
