import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function DELETE() {
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
      select: { id: true, hasFaceEncoding: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      )
    }

    // Update user untuk menandai bahwa mereka tidak lagi memiliki face encoding
    await prisma.user.update({
      where: { id: userId },
      data: { hasFaceEncoding: false }
    })

    // Hapus face encoding jika ada
    await prisma.faceEncoding.deleteMany({
      where: { userId }
    })

    return NextResponse.json({
      success: true,
      message: "Face encoding berhasil dihapus"
    })
  } catch (error: any) {
    console.error("Error deleting face encoding:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus face encoding. Silakan coba lagi." },
      { status: 500 }
    )
  }
} 