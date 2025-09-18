import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'authenticated'
const PROTECTED_PATHS = ['/', '/video', '/gallery'] // Protected paths requiring authentication

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Normalize common uppercase paths to lowercase (e.g., /GALLERY -> /gallery)
  const lower = pathname.toLowerCase()
  if (pathname !== lower && (lower.startsWith('/gallery') || lower.startsWith('/video'))) {
    const url = new URL(lower, request.url)
    return NextResponse.redirect(url)
  }

  // Allow static assets and public paths
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/api/health') ||
      pathname.startsWith('/enter') ||
      pathname.startsWith('/api/auth/simple') ||
      pathname.includes('.')) {
    return NextResponse.next()
  }

  // Check if user is authenticated with simple cookie check
  const authCookie = request.cookies.get(COOKIE_NAME)
  const isAuthenticated = authCookie?.value === 'true'

  // Check if the path requires authentication
  const requiresAuth = PROTECTED_PATHS.some(path => 
    pathname === path || pathname.startsWith(path)
  )

  if (requiresAuth && !isAuthenticated) {
    // Redirect to login page
    console.log('🔒 Redirecting unauthenticated user to /enter')
    const loginUrl = new URL('/enter', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated and trying to access login page or root, redirect to gallery
  if (isAuthenticated && (pathname === '/enter' || pathname === '/')) {
    console.log('🔄 Redirecting authenticated user to /gallery')
    const galleryUrl = new URL('/gallery', request.url)
    return NextResponse.redirect(galleryUrl)
  }

  // Add basic security headers
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}