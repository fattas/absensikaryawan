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
      select: { id: true, name: true, hasFaceEncoding: true }
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

    // Ambil face encoding yang tersimpan
    const savedFaceEncoding = await prisma.faceEncoding.findUnique({
      where: { userId },
      select: { encodingData: true }
    })

    if (!savedFaceEncoding || typeof savedFaceEncoding.encodingData !== 'string') {
      return NextResponse.json(
        { error: "Data face encoding tidak ditemukan atau tidak valid" },
        { status: 404 }
      )
    }

    // Parse JSON string menjadi array
    const savedEncodingArray = JSON.parse(savedFaceEncoding.encodingData)

    // Mengembalikan respons untuk pengujian
    return NextResponse.json({
      success: true,
      message: "Face encoding berhasil diverifikasi",
      userData: {
        userId: user.id,
        name: user.name
      },
      debug: {
        receivedEncodingLength: faceEncoding.length,
        savedEncodingLength: savedEncodingArray.length,
        // Sample pertama untuk memastikan format data benar
        receivedSample: faceEncoding.slice(0, 3),
        savedSample: savedEncodingArray.slice(0, 3)
      }
    })
  } catch (error: any) {
    console.error("Error verifying face encoding:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memverifikasi face encoding. Silakan coba lagi." },
      { status: 500 }
    )
  }
} 