import { NextResponse } from 'next/server'
import { mockSendMessage, mockGetSession } from '@/lib/mocks/plan'

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
