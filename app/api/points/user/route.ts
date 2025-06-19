import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { pointsService } from '@/lib/points-service'

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('user_token')
    
    if (!token) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      )
    }
    
    const userId = token.value
    const userPoints = await pointsService.getUserPoints(userId)
    
    if (!userPoints) {
      // Create initial points record if doesn't exist
      return NextResponse.json({
        success: true,
        data: {
          userId,
          points: 0,
          totalEarned: 0,
          currentStreak: 0,
          longestStreak: 0,
          badges: []
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      data: userPoints
    })
  } catch (error: any) {
    console.error("Error fetching user points:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch user points" },
      { status: 500 }
    )
  }
} 