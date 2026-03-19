import { NextResponse } from 'next/server'
import { mockGetSession } from '@/lib/mocks/plan'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId required', code: 'MISSING_SESSION_ID' },
      { status: 400 }
    )
  }

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
}
