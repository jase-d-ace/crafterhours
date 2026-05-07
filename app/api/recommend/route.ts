import { NextResponse } from 'next/server'
import { buildRecommendation } from '@/lib/recommender'

export async function GET() {
  const data = await buildRecommendation()
  return NextResponse.json(data)
}
