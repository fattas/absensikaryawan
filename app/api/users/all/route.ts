import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    // Verifikasi akses admin
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')
    
    if (!token) {
      return NextResponse.json(
        { error: "Tidak terautentikasi. Silakan login terlebih dahulu sebagai admin." },
        { status: 401 }
      )
    }

    const adminId = token.value
    
    // Cek apakah admin valid
    const admin = await prisma.user.findFirst({
      where: { 
        id: adminId,
        role: 'ADMIN'
      },
      select: { id: true }
    })

    if (!admin) {
      return NextResponse.json(
        { error: "Akses ditolak. Anda bukan admin." },
        { status: 403 }
      )
    }

    // Ambil semua pengguna (kecuali admin)
    const users = await prisma.user.findMany({
      where: {
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hasFaceEncoding: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format data untuk frontend
    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      has_face_encoding: user.hasFaceEncoding,
      created_at: user.createdAt.toISOString(),
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error: any) {
    console.error("Error fetching all users:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil daftar pengguna." },
      { status: 500 }
    )
  }
} 