import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { enhancedPointsService } from '@/lib/points-service-enhanced'

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('user-session')
    
    if (!userCookie) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }
    
    const userData = JSON.parse(userCookie.value)
    const userId = userData.id
    
    const userPoints = await enhancedPointsService.getUserPointsDetailed(userId)
    
    if (!userPoints) {
      return NextResponse.json({
        success: true,
        data: null
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