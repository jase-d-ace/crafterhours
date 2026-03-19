import { NextResponse } from 'next/server'
import { mockSendMessage, mockGetSession } from '@/lib/mocks/plan'
import { logger, serializeError } from '@/lib/logger'

export async function POST(request: Request) {
  let body: { sessionId?: string; message?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  const { sessionId, message } = body

  if (!sessionId || !message) {
    return NextResponse.json(
      { error: 'sessionId and message required', code: 'MISSING_FIELDS' },
      { status: 400 }
    )
  }

  let session
  try {
    // TODO: replace with real implementation
    session = mockGetSession(sessionId)
  } catch (e) {
    logger.error('api/plan/message', 'Failed to look up session', {
      code: 'INTERNAL_ERROR',
      sessionId,
      ...serializeError(e),
    })
    return NextResponse.json(
      { error: 'Failed to look up session', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }

  if (!session) {
    return NextResponse.json(
      { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
      { status: 404 }
    )
  }

  if (session.status !== 'planning') {
    return NextResponse.json(
      { error: 'Session is not in planning state', code: 'INVALID_SESSION_STATE' },
      { status: 409 }
    )
  }

  const messageCount = session.messages.filter(m => m.role === 'user').length
  const encoder = new TextEncoder()

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of mockSendMessage(sessionId, message, messageCount)) {
            controller.enqueue(encoder.encode(chunk))
          }
        } catch (error) {
          logger.error('api/plan/message', 'Stream error', {
            code: 'STREAM_ERROR',
            sessionId,
            ...serializeError(error),
          })
          const errorMessage = error instanceof Error ? error.message : 'Stream error'
          controller.error(new Error(errorMessage))
        } finally {
          controller.close()
        }
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream' } }
  )
}
