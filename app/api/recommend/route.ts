import { NextResponse } from 'next/server'
import { getMockRecommendation } from '@/lib/mocks/recommend'

export async function GET() {
  const recommendation = getMockRecommendation()
  return NextResponse.json({ recommendation })
}
