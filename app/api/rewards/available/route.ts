import { NextResponse } from 'next/server'
import { pointsService } from '@/lib/points-service'

export async function GET(req: Request) {
  try {
    const rewards = await pointsService.getAvailableRewards()
    
    return NextResponse.json({
      success: true,
      data: rewards
    })
  } catch (error: any) {
    console.error("Error fetching rewards:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch rewards" },
      { status: 500 }
    )
  }
} 