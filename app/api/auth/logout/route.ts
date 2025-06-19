import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.set('user_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    
    return NextResponse.json({ 
      success: true,
      message: "Logout berhasil"
    })
  } catch (error: any) {
    console.error("Error during logout:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat logout" },
      { status: 500 }
    )
  }
}
