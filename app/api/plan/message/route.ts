import { NextResponse } from 'next/server'
import { getSession, updateSessionMessages } from '@/lib/db'
import { streamPlanningResponse } from '@/lib/claude'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { sessionId, message } = body

  if (!sessionId || !message) {
    return NextResponse.json(
      { error: 'sessionId and message required', code: 'MISSING_FIELDS' },
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
      { error: 'Session is not in planning state', code: 'INVALID_SESSION_STATE' },
      { status: 409 }
    )
  }

  const messages = [...session.messages, { role: 'user' as const, content: message }]
  updateSessionMessages(sessionId, messages)

  const encoder = new TextEncoder()
  const stream = streamPlanningResponse(messages, session.hobbyId)

  return new Response(
    new ReadableStream({
      async start(controller) {
        let fullResponse = ''
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            fullResponse += event.delta.text
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        controller.close()

        updateSessionMessages(sessionId, [
          ...messages,
          { role: 'assistant', content: fullResponse },
        ])
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream' } }
  )
}
