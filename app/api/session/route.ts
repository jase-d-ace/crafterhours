import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET() {
  logger.info('api/session', 'Unimplemented route called', { method: 'GET' })
  return NextResponse.json(
    { error: 'Not implemented', code: 'NOT_IMPLEMENTED' },
    { status: 501 }
  )
}

export async function POST() {
  logger.info('api/session', 'Unimplemented route called', { method: 'POST' })
  return NextResponse.json(
    { error: 'Not implemented', code: 'NOT_IMPLEMENTED' },
    { status: 501 }
  )
}
