import { NextResponse } from 'next/server'
import { pointsService } from '@/lib/points-service'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const period = searchParams.get('period') || 'all-time'
    
    const leaderboard = await pointsService.getLeaderboard(limit, offset, period)
    
    return NextResponse.json({
      success: true,
      data: leaderboard
    })
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch leaderboard" },
      { status: 500 }
    )
  }
} 