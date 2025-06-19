import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.set('admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    
    return NextResponse.json({ 
      success: true,
      message: "Logout admin berhasil"
    })
  } catch (error: any) {
    console.error("Error during admin logout:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat logout admin" },
      { status: 500 }
    )
  }
}
