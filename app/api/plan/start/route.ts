import { NextResponse } from 'next/server'
import { getHobbyById, createSession, updateSessionMessages, abandonActiveSessions } from '@/lib/db'
import { getOpeningMessage } from '@/lib/claude'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { hobbyId } = body

  if (!hobbyId) {
    return NextResponse.json(
      { error: 'hobbyId required', code: 'MISSING_HOBBY_ID' },
      { status: 400 }
    )
  }

  const hobby = getHobbyById(hobbyId)
  if (!hobby) {
    return NextResponse.json(
      { error: 'Hobby not found', code: 'HOBBY_NOT_FOUND' },
      { status: 404 }
    )
  }

  abandonActiveSessions()
  const session = createSession(hobbyId)

  const openingMessage = await getOpeningMessage(hobbyId)
  updateSessionMessages(session.id, [{ role: 'assistant', content: openingMessage }])

  return NextResponse.json({
    sessionId: session.id,
    hobbyId,
    openingMessage,
  })
}
