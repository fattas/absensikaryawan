import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { pointsService } from '@/lib/points-service'

export async function POST(req: Request) {
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
    const { rewardId } = await req.json()
    
    if (!rewardId) {
      return NextResponse.json(
        { error: "Reward ID diperlukan" },
        { status: 400 }
      )
    }
    
    const result = await pointsService.redeemReward(userId, rewardId)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: result.message
    })
  } catch (error: any) {
    console.error("Error redeeming reward:", error)
    return NextResponse.json(
      { error: error.message || "Failed to redeem reward" },
      { status: 500 }
    )
  }
} 