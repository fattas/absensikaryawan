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

    // Ambil absensi terakhir user
    const latestAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!latestAttendance) {
      return NextResponse.json(
        { error: "Tidak ada data absensi ditemukan" },
        { status: 404 }
      )
    }

    // Format data untuk frontend
    const formattedAttendance = {
      id: latestAttendance.id,
      timestamp: latestAttendance.timestamp.toISOString(),
      type: latestAttendance.type,
      location: latestAttendance.location,
      latitude: latestAttendance.latitude,
      longitude: latestAttendance.longitude,
      user: latestAttendance.user,
    }

    return NextResponse.json(formattedAttendance)
  } catch (error: any) {
    console.error("Error fetching latest attendance:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil absensi terakhir. Silakan coba lagi." },
      { status: 500 }
    )
  }
} 