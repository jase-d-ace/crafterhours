import { NextResponse } from 'next/server'
import { getSession, getHobbyById } from '@/lib/db'
import { streamArtifactGeneration } from '@/lib/claude'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { sessionId, notes, hobbyId } = body

  if (!sessionId || !notes || !hobbyId) {
    return NextResponse.json(
      { error: 'sessionId, notes, and hobbyId required', code: 'MISSING_FIELDS' },
      { status: 400 }
    )
  }

  const sessionState = getSession(sessionId)
  if (!sessionState || !sessionState.sessionPlan) {
    return NextResponse.json(
      { error: 'Session not found or has no plan', code: 'SESSION_NOT_FOUND' },
      { status: 404 }
    )
  }

  const hobby = getHobbyById(hobbyId)
  if (!hobby) {
    return NextResponse.json(
      { error: 'Hobby not found', code: 'HOBBY_NOT_FOUND' },
      { status: 404 }
    )
  }

  const encoder = new TextEncoder()
  const stream = streamArtifactGeneration(notes, sessionState.sessionPlan, hobbyId)

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        controller.close()
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream' } }
  )
}
