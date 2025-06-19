import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
    // Verifikasi akses admin
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')
    
    if (!token) {
      return NextResponse.json(
        { error: "Tidak terautentikasi sebagai admin" },
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

    // Cek apakah user ada
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, hasFaceEncoding: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      )
    }

    // Hapus data face encoding jika ada
    if (user.hasFaceEncoding) {
      // Hapus data face encoding
      await prisma.faceEncoding.deleteMany({
        where: { userId }
      })
      
      // Update status user
      await prisma.user.update({
        where: { id: userId },
        data: { hasFaceEncoding: false }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Pendaftaran wajah untuk pengguna ${user.name} berhasil direset`
    })
  } catch (error: any) {
    console.error("Error resetting face enrollment:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mereset pendaftaran wajah" },
      { status: 500 }
    )
  }
} 