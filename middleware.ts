import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userToken = request.cookies.get('user_token')
  const adminToken = request.cookies.get('admin_token')

  // Halaman yang memerlukan autentikasi user
  const userProtectedPaths = [
    '/dashboard',
    '/profile',
    '/check-in',
    '/attendance-history',
    '/user/enroll-face',
  ]

  // Halaman yang memerlukan autentikasi admin
  const adminProtectedPaths = [
    '/admin/dashboard',
    '/admin/time-settings',
  ]

  // Halaman login/register yang tidak boleh diakses jika sudah login
  const authPaths = ['/', '/register', '/admin']

  // Periksa apakah user mencoba mengakses halaman yang dilindungi tanpa login
  if (userProtectedPaths.some(path => pathname.startsWith(path))) {
    if (!userToken) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Periksa apakah admin mencoba mengakses halaman admin tanpa login
  if (adminProtectedPaths.some(path => pathname.startsWith(path))) {
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // Redirect user yang sudah login dari halaman login ke dashboard
  if (pathname === '/' && userToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect admin yang sudah login dari halaman login admin ke dashboard admin
  if (pathname === '/admin' && adminToken) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|models).*)',
  ],
} 