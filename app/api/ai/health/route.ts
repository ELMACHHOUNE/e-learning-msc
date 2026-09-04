import { NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai'

export async function GET() {
  try {
    const provider = getAIProvider()
    const health = await provider.healthCheck()
    return NextResponse.json(health)
  } catch {
    return NextResponse.json(
      { available: false, provider: 'unknown', model: 'unknown', modelLoaded: false },
      { status: 503 },
    )
  }
}
