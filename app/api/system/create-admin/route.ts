import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// Endpoint khusus untuk membuat akun admin
// Hanya untuk digunakan saat setup awal sistem
export async function GET() {
  try {
    // Cek apakah sudah ada admin
    const existingAdmin = await prisma.user.findFirst({
      where: { 
        email: 'admin@example.com',
        role: 'ADMIN'
      }
    })

    if (existingAdmin) {
      return NextResponse.json({
        message: "Admin sudah ada",
        admin: {
          id: existingAdmin.id,
          email: existingAdmin.email,
          name: existingAdmin.name
        }
      })
    }

    // Hash password admin
    const hashedPassword = await hash('admin123', 12)

    // Buat user admin baru
    const admin = await prisma.user.create({
      data: {
        name: 'Administrator',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN',
        hasFaceEncoding: false
      }
    })

    return NextResponse.json({
      success: true,
      message: "Admin berhasil dibuat",
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      }
    })
  } catch (error: any) {
    console.error("Error creating admin:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat admin", details: error.message },
      { status: 500 }
    )
  }
} 