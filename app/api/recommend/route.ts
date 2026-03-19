import { NextResponse } from 'next/server'
import { getMockRecommendation } from '@/lib/mocks/recommend'
import { logger, serializeError } from '@/lib/logger'

export async function GET() {
  try {
    const recommendation = getMockRecommendation()
    return NextResponse.json({ recommendation })
  } catch (e) {
    logger.error('api/recommend', 'Failed to get recommendation', {
      code: 'INTERNAL_ERROR',
      ...serializeError(e),
    })
    return NextResponse.json(
      { error: 'Failed to get recommendation', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
