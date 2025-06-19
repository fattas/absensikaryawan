import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET() {
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
    const admin = await prisma.user.findFirst({
      where: {
        id: adminId,
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    if (!admin) {
      return NextResponse.json(
        { error: "Admin tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json(admin)
  } catch (error: any) {
    console.error("Error fetching admin profile:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil profil admin" },
      { status: 500 }
    )
  }
}
