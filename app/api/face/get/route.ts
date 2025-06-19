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
      select: { id: true, hasFaceEncoding: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      )
    }

    if (!user.hasFaceEncoding) {
      return NextResponse.json(
        { error: "User belum mendaftarkan wajah" },
        { status: 404 }
      )
    }

    // Ambil face encoding
    const faceEncoding = await prisma.faceEncoding.findUnique({
      where: { userId },
      select: { encodingData: true }
    })

    if (!faceEncoding) {
      return NextResponse.json(
        { error: "Face encoding tidak ditemukan" },
        { status: 404 }
      )
    }

    // Pastikan encodingData adalah string
    if (typeof faceEncoding.encodingData !== 'string') {
      return NextResponse.json(
        { error: "Format data encoding tidak valid" },
        { status: 500 }
      )
    }

    // Parse JSON string menjadi array
    const parsedFaceEncoding = JSON.parse(faceEncoding.encodingData)

    return NextResponse.json({
      success: true,
      faceEncoding: parsedFaceEncoding
    })
  } catch (error: any) {
    console.error("Error fetching face encoding:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil face encoding. Silakan coba lagi." },
      { status: 500 }
    )
  }
} 