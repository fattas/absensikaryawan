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
    
    const rewards = await enhancedPointsService.getAvailableRewardsEnhanced()
    
    return NextResponse.json({
      success: true,
      data: rewards
    })
  } catch (error: any) {
    console.error("Error fetching rewards:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch rewards" },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const admin = await validateAdminSession()
    
    const body = await req.json()
    const { name, description, pointsCost, quantity, category, imageUrl, stockAlertThreshold, maxPerUser } = body
    
    if (!name || !description || !pointsCost) {
      return NextResponse.json(
        { error: "Name, description, and points cost are required" },
        { status: 400 }
      )
    }
    
    await enhancedPointsService.createOrUpdateReward({
      name,
      description,
      pointsCost: parseInt(pointsCost),
      quantity: parseInt(quantity) || 0,
      category: category || 'general',
      imageUrl,
      stockAlertThreshold: parseInt(stockAlertThreshold) || 5,
      maxPerUser: parseInt(maxPerUser) || -1,
      isActive: true
    })
    
    return NextResponse.json({
      success: true,
      message: "Reward created successfully"
    })
  } catch (error: any) {
    console.error("Error creating reward:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create reward" },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await validateAdminSession()
    
    const body = await req.json()
    const { id, name, description, pointsCost, quantity, category, imageUrl, stockAlertThreshold, maxPerUser, isActive } = body
    
    if (!id) {
      return NextResponse.json(
        { error: "Reward ID is required" },
        { status: 400 }
      )
    }
    
    await enhancedPointsService.createOrUpdateReward({
      id,
      name,
      description,
      pointsCost: pointsCost ? parseInt(pointsCost) : undefined,
      quantity: quantity !== undefined ? parseInt(quantity) : undefined,
      category,
      imageUrl,
      stockAlertThreshold: stockAlertThreshold ? parseInt(stockAlertThreshold) : undefined,
      maxPerUser: maxPerUser !== undefined ? parseInt(maxPerUser) : undefined,
      isActive
    })
    
    return NextResponse.json({
      success: true,
      message: "Reward updated successfully"
    })
  } catch (error: any) {
    console.error("Error updating reward:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update reward" },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    )
  }
} 