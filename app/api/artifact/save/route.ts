import { NextResponse } from 'next/server'
import { saveArtifact } from '@/lib/db'
import type { Artifact } from '@/lib/types'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { dbSessionId, hobbyId, type, content } = body

  if (!dbSessionId || !hobbyId || !type || !content) {
    return NextResponse.json(
      { error: 'dbSessionId, hobbyId, type, and content required', code: 'MISSING_FIELDS' },
      { status: 400 }
    )
  }

  const validTypes: Artifact['type'][] = ['journal', 'practice_log', 'coding_summary']
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: 'Invalid artifact type', code: 'INVALID_TYPE' },
      { status: 400 }
    )
  }

  const artifact = saveArtifact({
    sessionId: dbSessionId,
    hobbyId,
    type: type as Artifact['type'],
    content,
  })

  return NextResponse.json({ artifact })
}
