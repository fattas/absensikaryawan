import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    console.log("Admin login attempt for email:", email);

    // Validasi input
    if (!email || !password) {
      console.log("Admin login failed: Missing email or password");
      return NextResponse.json(
        { success: false, error: "Email dan password harus diisi" },
        { status: 400 }
      )
    }

    const admin = await prisma.user.findFirst({
      where: {
        email,
        role: 'ADMIN',
      },
    })

    if (!admin) {
      console.log("Admin login failed: Admin not found with email:", email);
      return NextResponse.json(
        { success: false, error: "Email atau password admin salah" },
        { status: 401 }
      )
    }

    console.log("Admin found:", admin.id, admin.email);
    
    const isValidPassword = await compare(password, admin.password)
    if (!isValidPassword) {
      console.log("Admin login failed: Invalid password for admin:", admin.email);
      return NextResponse.json(
        { success: false, error: "Email atau password admin salah" },
        { status: 401 }
      )
    }

    console.log("Admin login successful for:", admin.email);
    
    // Set auth cookie
    const cookieStore = await cookies()
    cookieStore.set('admin_token', admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return NextResponse.json({ 
      success: true,
      message: "Login admin berhasil"
    })
  } catch (error: any) {
    console.error("Error during admin login:", error)
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat login admin. Silakan coba lagi." },
      { status: 500 }
    )
  }
}
