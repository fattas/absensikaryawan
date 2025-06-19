import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { enhancedPointsService } from '@/lib/points-service-enhanced'

async function validateAdminSession() {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get('admin_token')
  
  if (!adminToken) {
    throw new Error('Admin authentication required')
  }
  
  try {
    const { prisma } = require('@/lib/prisma')
    const admin = await prisma.user.findFirst({
      where: {
        id: adminToken.value,
        role: 'ADMIN'
      }
    })
    
    if (!admin) {
      throw new Error('Admin access required')
    }
    
    return {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.name
    }
  } catch (error) {
    throw new Error('Invalid admin session')
  }
}

export async function GET(req: Request) {
  try {
    await validateAdminSession()
    
    const analytics = await enhancedPointsService.getPointsAnalytics()
    
    return NextResponse.json({
      success: true,
      data: analytics
    })
  } catch (error: any) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    )
  }
} 