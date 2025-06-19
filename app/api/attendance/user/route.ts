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

    // Ambil riwayat absensi user
    const attendances = await prisma.attendance.findMany({
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

    // Format data untuk frontend
    const formattedAttendances = attendances.map((attendance: any) => {
      // Format pesan keterlambatan jika terlambat
      let lateMessage = "";
      if (attendance.isLate && attendance.lateMinutes) {
        const lateHours = Math.floor(attendance.lateMinutes / 60);
        const remainingMinutes = attendance.lateMinutes % 60;
        
        if (lateHours > 0 && remainingMinutes > 0) {
          lateMessage = `Terlambat ${lateHours} jam ${remainingMinutes} menit`;
        } else if (lateHours > 0) {
          lateMessage = `Terlambat ${lateHours} jam`;
        } else {
          lateMessage = `Terlambat ${remainingMinutes} menit`;
        }
      }

      return {
        id: attendance.id,
        timestamp: attendance.timestamp.toISOString(),
        type: attendance.type,
        location: attendance.location,
        latitude: attendance.latitude,
        longitude: attendance.longitude,
        isSuccessful: true, // Assume successful if it's recorded
        user: attendance.user,
        isLate: attendance.isLate || false,
        lateMinutes: attendance.lateMinutes || 0,
        lateMessage: lateMessage
      };
    });

    return NextResponse.json(formattedAttendances)
  } catch (error: any) {
    console.error("Error fetching attendance history:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil riwayat absensi. Silakan coba lagi." },
      { status: 500 }
    )
  }
} 