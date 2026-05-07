import { NextResponse } from 'next/server'
import { getSessionDetails } from '@/lib/db'

export async function GET() {
  const sessions = getSessionDetails(50)
  return NextResponse.json({ sessions })
}
