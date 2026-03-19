import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST() {
  logger.info('api/artifact', 'Unimplemented route called', { method: 'POST' })
  return NextResponse.json(
    { error: 'Not implemented', code: 'NOT_IMPLEMENTED' },
    { status: 501 }
  )
}
