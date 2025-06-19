import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// Definisikan interface untuk data Attendance
interface AttendanceWithUser {
  id: string;
  timestamp: Date;
  type: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isLate?: boolean | null;
  lateMinutes?: number | null;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')
    if (!token) {
      return NextResponse.json(
        { error: "Tidak terautentikasi sebagai admin" },
        { status: 401 }
      )
    }

    const adminId = token.value
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    // Validasi pagination
    if (page < 1 || limit < 1 || limit > 500) {
      return NextResponse.json(
        { error: "Parameter pagination tidak valid" },
        { status: 400 }
      )
    }

    // Cek apakah admin ada
    const admin = await prisma.user.findFirst({
      where: { 
        id: adminId,
        role: 'ADMIN'
      },
      select: { id: true }
    })

    if (!admin) {
      return NextResponse.json(
        { error: "Admin tidak ditemukan" },
        { status: 404 }
      )
    }

    const skip = (page - 1) * limit

    // Ambil data attendance dengan pagination
    const [total, attendances] = await Promise.all([
      prisma.attendance.count(),
      prisma.attendance.findMany({
        skip,
        take: limit,
        orderBy: {
          timestamp: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]) as [number, AttendanceWithUser[]]

    // Format data untuk frontend, sesuaikan dengan format yang diharapkan komponen
    const formattedAttendances = attendances.map((attendance) => {
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
        userId: attendance.user?.id || "",
        timestamp: attendance.timestamp.toISOString(),
        type: attendance.type,
        location: attendance.location,
        latitude: attendance.latitude || 0,
        longitude: attendance.longitude || 0,
        user: attendance.user,
        // Data tambahan yang mungkin dibutuhkan oleh komponen
        user_name: attendance.user?.name || "Unknown User",
        is_successful: true, // Default success jika tidak ada data
        face_match_score: 1.0, // Default score jika tidak ada data
        isLate: attendance.isLate || false,
        lateMinutes: attendance.lateMinutes || 0,
        lateMessage: lateMessage
      };
    });

    return NextResponse.json({
      total,
      attendances: formattedAttendances,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
    })
  } catch (error: any) {
    console.error("Error fetching all attendance data:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data absensi" },
      { status: 500 }
    )
  }
} 