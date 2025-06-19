import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
  try {
    // Verifikasi akses admin
    const cookieStore = await cookies()
    const token = cookieStore.get('user_token')
    
    if (!token) {
      return NextResponse.json(
        { error: "Tidak terautentikasi. Silakan login terlebih dahulu." },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get location settings history
    const [total, settings] = await Promise.all([
      prisma.locationSetting.count(),
      prisma.locationSetting.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ])

    return NextResponse.json({
      total,
      settings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    })
  } catch (error: any) {
    console.error("Error fetching location settings history:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil riwayat pengaturan lokasi" },
      { status: 500 }
    )
  }
} 