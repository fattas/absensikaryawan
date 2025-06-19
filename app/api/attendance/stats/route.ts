import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

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

    // Tanggal hari ini
    const today = new Date()
    const startOfToday = new Date(today.setHours(0, 0, 0, 0))
    const endOfToday = new Date(today.setHours(23, 59, 59, 999))

    // Tanggal minggu ini
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    // Tanggal bulan ini
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)

    // Hitung statistik
    const [
      todayAttendance,
      weekAttendance,
      monthAttendance,
      totalAttendance,
      todayCheckIn,
      todayCheckOut
    ] = await Promise.all([
      // Attendance hari ini
      prisma.attendance.count({
        where: {
          userId,
          timestamp: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
      // Attendance minggu ini
      prisma.attendance.count({
        where: {
          userId,
          timestamp: {
            gte: startOfWeek,
          },
        },
      }),
      // Attendance bulan ini
      prisma.attendance.count({
        where: {
          userId,
          timestamp: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      // Total attendance
      prisma.attendance.count({
        where: {
          userId,
        },
      }),
      // Check-in hari ini
      prisma.attendance.findFirst({
        where: {
          userId,
          type: 'CHECK_IN',
          timestamp: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      }),
      // Check-out hari ini
      prisma.attendance.findFirst({
        where: {
          userId,
          type: 'CHECK_OUT',
          timestamp: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      }),
    ])

    return NextResponse.json({
      today: todayAttendance,
      thisWeek: weekAttendance,
      thisMonth: monthAttendance,
      total: totalAttendance,
      todayCheckIn: todayCheckIn ? todayCheckIn.timestamp.toISOString() : null,
      todayCheckOut: todayCheckOut ? todayCheckOut.timestamp.toISOString() : null,
      hasCheckedIn: !!todayCheckIn,
      hasCheckedOut: !!todayCheckOut,
    })
  } catch (error: any) {
    console.error("Error fetching attendance stats:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil statistik absensi" },
      { status: 500 }
    )
  }
} 