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
    
    const activities = await enhancedPointsService.getPointActivities()
    
    return NextResponse.json({
      success: true,
      data: activities
    })
  } catch (error: any) {
    console.error("Error fetching point activities:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch point activities" },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    await validateAdminSession()
    
    const body = await req.json()
    const { activityCode, basePoints, isActive } = body
    
    if (!activityCode || basePoints === undefined) {
      return NextResponse.json(
        { error: "Activity code and base points are required" },
        { status: 400 }
      )
    }
    
    await enhancedPointsService.updatePointActivity(activityCode, basePoints, isActive !== false)
    
    return NextResponse.json({
      success: true,
      message: "Point activity updated successfully"
    })
  } catch (error: any) {
    console.error("Error updating point activity:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update point activity" },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    )
  }
} 