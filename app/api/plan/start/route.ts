import { NextResponse } from 'next/server'
import { getDefaultHobbies } from '@/lib/hobbies'
import { mockStartSession } from '@/lib/mocks/plan'

export async function POST(request: Request) {
  let body: { hobbyId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'INVALID_BODY' },
      { status: 400 }
    )
  }

  const { hobbyId } = body

  if (!hobbyId) {
    return NextResponse.json(
      { error: 'hobbyId required', code: 'MISSING_HOBBY_ID' },
      { status: 400 }
    )
  }

  const hobby = getDefaultHobbies().find((h) => h.id === hobbyId)
  if (!hobby) {
    return NextResponse.json(
      { error: 'Hobby not found', code: 'HOBBY_NOT_FOUND' },
      { status: 404 }
    )
  }

  // TODO: replace with real implementation
  const result = mockStartSession(hobbyId)

  return NextResponse.json({
    sessionId: result.sessionId,
    hobbyId,
    openingMessage: result.openingMessage,
  })
}
