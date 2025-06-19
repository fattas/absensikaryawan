import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    
    // Check for both admin_token and user_token
    const adminToken = cookieStore.get('admin_token')
    const userToken = cookieStore.get('user_token')
    
    console.log("Session check - admin_token:", adminToken?.value ? "exists" : "null")
    console.log("Session check - user_token:", userToken?.value ? "exists" : "null")
    
    let userId = null
    let tokenType = null
    
    if (adminToken) {
      userId = adminToken.value
      tokenType = 'admin_token'
    } else if (userToken) {
      userId = userToken.value
      tokenType = 'user_token'
    }
    
    if (!userId) {
      return NextResponse.json({
        authenticated: false,
        message: "No authentication token found"
      })
    }
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hasFaceEncoding: true
      }
    })
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        message: "User not found",
        tokenType
      })
    }
    
    return NextResponse.json({
      authenticated: true,
      user,
      tokenType,
      isAdmin: user.role === 'ADMIN'
    })
  } catch (error: any) {
    console.error("Session check error:", error)
    return NextResponse.json(
      { error: "Failed to check session" },
      { status: 500 }
    )
  }
} 