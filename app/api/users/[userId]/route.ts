import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// Mendapatkan pengguna berdasarkan ID
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId
    
    // Verifikasi akses admin
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')
    const userToken = cookieStore.get('user_token')
    
    // Jika tidak ada token sama sekali
    if (!adminToken && !userToken) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      )
    }

    // Jika ada token admin, verifikasi
    if (adminToken) {
      const admin = await prisma.user.findFirst({
        where: { 
          id: adminToken.value,
          role: 'ADMIN'
        },
        select: { id: true }
      })

      if (!admin) {
        return NextResponse.json(
          { error: "Akses ditolak. Admin tidak valid." },
          { status: 403 }
        )
      }
    } 
    // Jika ada token user, cek apakah user sedang mengakses datanya sendiri
    else if (userToken && userToken.value !== userId) {
      return NextResponse.json(
        { error: "Akses ditolak. Anda tidak dapat melihat data pengguna lain." },
        { status: 403 }
      )
    }

    // Cek apakah user ada
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hasFaceEncoding: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      )
    }

    // Format data untuk response
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      has_face_encoding: user.hasFaceEncoding,
      created_at: user.createdAt.toISOString(),
    }

    return NextResponse.json(formattedUser)
  } catch (error: any) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data pengguna" },
      { status: 500 }
    )
  }
}

// Memperbarui pengguna
export async function PUT(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId
    
    // Verifikasi akses admin
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')
    const userToken = cookieStore.get('user_token')
    
    // Jika tidak ada token sama sekali
    if (!adminToken && !userToken) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      )
    }

    // Jika ada token admin, verifikasi
    if (adminToken) {
      const admin = await prisma.user.findFirst({
        where: { 
          id: adminToken.value,
          role: 'ADMIN'
        },
        select: { id: true }
      })

      if (!admin) {
        return NextResponse.json(
          { error: "Akses ditolak. Admin tidak valid." },
          { status: 403 }
        )
      }
    } 
    // Jika ada token user, cek apakah user sedang mengupdate datanya sendiri
    else if (userToken && userToken.value !== userId) {
      return NextResponse.json(
        { error: "Akses ditolak. Anda tidak dapat mengubah data pengguna lain." },
        { status: 403 }
      )
    }

    // Cek apakah user ada
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      )
    }

    // Ambil data yang akan diupdate
    const updateData = await req.json()
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        // Hanya update field yang diizinkan
        name: updateData.name,
        // Email update hanya oleh admin
        ...(adminToken ? { email: updateData.email } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hasFaceEncoding: true,
        createdAt: true,
      }
    })

    // Format data untuk response
    const formattedUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      has_face_encoding: updatedUser.hasFaceEncoding,
      created_at: updatedUser.createdAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      message: "Data pengguna berhasil diperbarui",
      user: formattedUser
    })
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui data pengguna" },
      { status: 500 }
    )
  }
}

// Menghapus pengguna
export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId
    
    // Verifikasi akses admin
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')
    
    if (!adminToken) {
      return NextResponse.json(
        { error: "Akses ditolak. Hanya admin yang dapat menghapus pengguna." },
        { status: 403 }
      )
    }

    const admin = await prisma.user.findFirst({
      where: { 
        id: adminToken.value,
        role: 'ADMIN'
      },
      select: { id: true }
    })

    if (!admin) {
      return NextResponse.json(
        { error: "Akses ditolak. Admin tidak valid." },
        { status: 403 }
      )
    }

    // Cek apakah user ada
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      )
    }

    // Hapus data face encoding jika ada
    await prisma.faceEncoding.deleteMany({
      where: { userId }
    })
    
    // Hapus data attendance
    await prisma.attendance.deleteMany({
      where: { userId }
    })
    
    // Hapus user
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({
      success: true,
      message: "Pengguna berhasil dihapus"
    })
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus pengguna" },
      { status: 500 }
    )
  }
} 