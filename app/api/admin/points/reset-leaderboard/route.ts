import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

async function validateAdminSession() {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get('admin_token')
  
  if (!adminToken) {
    throw new Error('Admin authentication required')
  }
  
  try {
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

export async function POST(req: Request) {
  try {
    const admin = await validateAdminSession()
    const body = await req.json()
    const { resetType, reason } = body
    
    if (!resetType || !reason) {
      return NextResponse.json(
        { error: "Reset type and reason are required" },
        { status: 400 }
      )
    }
    
    let resetQuery = ''
    let logReason = `Leaderboard reset (${resetType}): ${reason}`
    
    switch (resetType) {
      case 'monthly':
        resetQuery = `
          UPDATE user_points 
          SET currentStreak = 0, 
              lastUpdated = NOW()
          WHERE lastUpdated < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `
        break
        
      case 'weekly':
        resetQuery = `
          UPDATE user_points 
          SET currentStreak = 0,
              lastUpdated = NOW()
          WHERE lastUpdated < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        `
        break
        
      case 'points':
        resetQuery = `
          UPDATE user_points 
          SET points = 0,
              currentStreak = 0,
              lastUpdated = NOW()
        `
        break
        
      case 'full':
        resetQuery = `
          UPDATE user_points 
          SET points = 0,
              totalEarned = 0,
              currentStreak = 0,
              longestStreak = 0,
              lastUpdated = NOW()
        `
        break
        
      default:
        return NextResponse.json(
          { error: "Invalid reset type" },
          { status: 400 }
        )
    }
    
    // Execute the reset
    await prisma.$executeRawUnsafe(resetQuery)
    
    // Log the reset action
    await prisma.$executeRaw`
      INSERT INTO admin_actions (id, adminId, action, details, timestamp)
      VALUES (${uuidv4()}, ${admin.id}, 'LEADERBOARD_RESET', ${logReason}, NOW())
    `
    
    // If full reset, also clear point history (optional)
    if (resetType === 'full') {
      await prisma.$executeRaw`
        INSERT INTO point_history (id, userId, points, reason, activity_code)
        SELECT ${uuidv4()}, userId, -points, ${logReason}, 'ADMIN_RESET'
        FROM user_points 
        WHERE points > 0
      `
    }
    
    return NextResponse.json({
      success: true,
      message: `Leaderboard ${resetType} reset completed successfully`
    })
    
  } catch (error: any) {
    console.error("Error resetting leaderboard:", error)
    return NextResponse.json(
      { error: error.message || "Failed to reset leaderboard" },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    )
  }
} 