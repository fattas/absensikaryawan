import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
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
    const { faceEncoding } = await req.json()

    // Validasi input
    if (!faceEncoding || !Array.isArray(faceEncoding)) {
      return NextResponse.json(
        { error: "Data face encoding tidak valid" },
        { status: 400 }
      )
    }

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

    // Update user untuk menandai bahwa mereka memiliki face encoding
    await prisma.user.update({
      where: { id: userId },
      data: { hasFaceEncoding: true }
    })

    // Mengubah array menjadi JSON string sebelum disimpan
    const encodingDataString = JSON.stringify(faceEncoding)

    // Simpan atau update face encoding
    await prisma.faceEncoding.upsert({
      where: { userId },
      create: {
        userId,
        encodingData: encodingDataString,
      },
      update: {
        encodingData: encodingDataString,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Face encoding berhasil disimpan"
    })
  } catch (error: any) {
    console.error("Error saving face encoding:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan face encoding. Silakan coba lagi." },
      { status: 500 }
    )
  }
} 