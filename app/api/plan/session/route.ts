import { NextResponse } from 'next/server'
import { getSession } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

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

  return NextResponse.json({
    sessionId: session.id,
    hobbyId: session.hobbyId,
    status: session.status,
    messages: session.messages,
    sessionPlan: session.sessionPlan,
  })
}
