import { NextResponse } from 'next/server'
import { enhancedPointsService } from '@/lib/points-service-enhanced'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || undefined
    
    const terms = await enhancedPointsService.getPointsTerms(category)
    
    return NextResponse.json({
      success: true,
      data: terms
    })
  } catch (error: any) {
    console.error("Error fetching points terms:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch points terms" },
      { status: 500 }
    )
  }
} 