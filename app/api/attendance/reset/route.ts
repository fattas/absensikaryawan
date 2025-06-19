import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// POST /api/attendance/reset - Reset attendance untuk user tertentu (hanya hari ini)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Check for both admin_token and user_token (admin might login via regular login)
    let adminId = null
    const adminToken = cookieStore.get('admin_token')
    const userToken = cookieStore.get('user_token')
    
    if (adminToken) {
      adminId = adminToken.value
    } else if (userToken) {
      adminId = userToken.value
    } else {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      )
    }
    
    // Verifikasi admin
    const admin = await prisma.user.findFirst({
      where: { 
        id: adminId,
        role: 'ADMIN'
      },
      select: { id: true }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin tidak ditemukan' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID diperlukan' },
        { status: 400 }
      )
    }

    // Verifikasi user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Only allow resetting today's attendance for testing purposes
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get attendance records that will be deleted (for logging)
    const attendanceToDelete = await prisma.attendance.findMany({
      where: {
        userId,
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      },
      select: {
        id: true,
        type: true,
        timestamp: true
      }
    })

    // Only proceed if there are records to delete
    if (attendanceToDelete.length === 0) {
      return NextResponse.json({
        success: false,
        message: `${user.name} belum memiliki absensi hari ini`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      })
    }

    // Delete only today's attendance records
    const deletedRecords = await prisma.attendance.deleteMany({
      where: {
        userId,
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    // Log reset action untuk audit
    console.log(`Admin ${adminId} reset attendance untuk user ${userId} pada tanggal ${today.toISOString()}`)
    console.log(`Deleted ${deletedRecords.count} attendance records:`)
    attendanceToDelete.forEach(att => {
      console.log(`  - ${att.type} at ${att.timestamp}`)
    })

    return NextResponse.json({
      success: true,
      message: `Berhasil reset absensi hari ini untuk ${user.name}`,
      deletedCount: deletedRecords.count,
      deletedRecords: attendanceToDelete.map(att => ({
        type: att.type,
        timestamp: att.timestamp
      })),
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      date: today.toISOString()
    })
  } catch (error: any) {
    console.error('Error resetting attendance:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat reset absensi' },
      { status: 500 }
    )
  }
} 