import { NextResponse } from 'next/server'
import { mockAbandonSession, mockGetSession } from '@/lib/mocks/plan'

export async function POST(request: Request) {
  let body: { sessionId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  const { sessionId } = body

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

  if (session.status !== 'planning') {
    return NextResponse.json(
      { error: 'Session is already finalized', code: 'INVALID_SESSION_STATE' },
      { status: 409 }
    )
  }

  const result = mockAbandonSession(sessionId)
  return NextResponse.json(result)
}
