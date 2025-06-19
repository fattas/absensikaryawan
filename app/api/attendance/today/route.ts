import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import LeaveService from '@/lib/leave-service'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('user_token')
    if (!token) {
      return NextResponse.json(
        { error: "Tidak terautentikasi. Silakan login terlebih dahulu." },
        { status: 401 }
      )
    }

    const userId = token.value

    // Cek apakah user ada
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      )
    }

    // Get time settings
    const timeSettings = await prisma.timeSettings.findFirst({
      where: {
        isActive: true,
      },
    })

    // Get attendance hari ini
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayAttendances = await prisma.attendance.findMany({
      where: {
        userId,
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    // Check if user is on leave today
    const leaveStatus = await LeaveService.isUserOnLeave(userId, new Date());

    // Process attendance data
    const checkIn = todayAttendances.find(att => att.type === 'CHECK_IN')
    const checkOut = todayAttendances.find(att => att.type === 'CHECK_OUT')

    const result = {
      date: today.toISOString(),
      timeSettings: timeSettings ? {
        maxClockInTime: timeSettings.maxClockInTime,
        minClockOutTime: timeSettings.minClockOutTime
      } : null,
      attendance: {
        checkIn: checkIn ? {
          id: checkIn.id,
          timestamp: checkIn.timestamp.toISOString(),
          location: checkIn.location,
          isLate: checkIn.isLate || false,
          lateMinutes: checkIn.lateMinutes || 0,
          latitude: checkIn.latitude,
          longitude: checkIn.longitude
        } : null,
        checkOut: checkOut ? {
          id: checkOut.id,
          timestamp: checkOut.timestamp.toISOString(),
          location: checkOut.location,
          latitude: checkOut.latitude,
          longitude: checkOut.longitude
        } : null
      },
      leave: leaveStatus,
      status: {
        hasCheckedIn: !!checkIn,
        hasCheckedOut: !!checkOut,
        isComplete: !!checkIn && !!checkOut,
        isOnLeave: leaveStatus.onLeave,
        message: leaveStatus.onLeave ? 
                 `Sedang ${leaveStatus.leaveType === 'ANNUAL_LEAVE' ? 'Cuti' : 
                          leaveStatus.leaveType === 'PERMISSION' ? 'Izin' :
                          leaveStatus.leaveType === 'SICK_LEAVE' ? 'Sakit' : 'Cuti Darurat'}` :
                 !checkIn ? 'Belum Absen Masuk' : 
                 (checkIn && !checkOut) ? 'Sudah Absen Masuk' : 
                 'Absensi Hari Ini Selesai'
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error fetching today's attendance:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data absensi hari ini." },
      { status: 500 }
    )
  }
} 