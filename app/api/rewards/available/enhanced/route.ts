import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { enhancedPointsService } from '@/lib/points-service-enhanced'

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get('user-session')
    
    let userId: string | undefined
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie.value)
        userId = userData.id
      } catch (error) {
        console.warn('Invalid user session cookie')
      }
    }
    
    const rewards = await enhancedPointsService.getAvailableRewardsEnhanced(userId)
    
    return NextResponse.json({
      success: true,
      data: rewards
    })
  } catch (error: any) {
    console.error("Error fetching enhanced rewards:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch rewards" },
      { status: 500 }
    )
  }
} 