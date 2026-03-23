import { NextResponse } from 'next/server'
import { getMockRecommendation } from '@/lib/mocks/recommend'

export async function GET() {
  const data = getMockRecommendation()
  return NextResponse.json(data)
}
