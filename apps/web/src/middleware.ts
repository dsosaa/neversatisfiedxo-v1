import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'nsx_gate'
const PROTECTED_PATHS = ['/', '/video']
const PUBLIC_PATHS = ['/enter', '/api/gate', '/api/health']

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100 // max requests per window
const RATE_LIMIT_AUTH_MAX = 5 // max auth attempts per window

// In-memory rate limiting (use Redis/database in production)
const rateLimitStore = new Map<string, { requests: number; resetTime: number; authAttempts: number }>()

// Generate nonce for CSP as per Context7 best practices
function generateNonce(): string {
  // Use Web Crypto API for Edge Runtime compatibility
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

// Generate CSP header with environment-specific configuration
function generateCSPHeader(nonce: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  const cspHeader = isDevelopment ? `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https://videodelivery.net https://imagedelivery.net https://*.cloudflarestream.com blob:;
    media-src 'self' https://videodelivery.net https://*.cloudflarestream.com blob:;
    frame-src 'self' https://iframe.videodelivery.net https://challenges.cloudflare.com;
    connect-src 'self' https://cloudflareinsights.com https://api.cloudflare.com https://*.cloudflarestream.com;
    worker-src 'self' blob:;
    manifest-src 'self';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    object-src 'none';
  ` : `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https://challenges.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https://videodelivery.net https://imagedelivery.net https://*.cloudflarestream.com blob:;
    media-src 'self' https://videodelivery.net https://*.cloudflarestream.com blob:;
    frame-src 'self' https://iframe.videodelivery.net https://challenges.cloudflare.com;
    connect-src 'self' https://cloudflareinsights.com https://api.cloudflare.com https://*.cloudflarestream.com;
    worker-src 'self' blob:;
    manifest-src 'self';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    object-src 'none';
    upgrade-insecure-requests;
  `
  
  // Replace newline characters and spaces for clean header
  return cspHeader.replace(/\s{2,}/g, ' ').trim()
}

function getRateLimitKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
            request.headers.get('x-real-ip') || 
            'anonymous'
  return ip
}

function checkRateLimit(key: string, isAuthRequest = false): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key)
  }

  const currentEntry = rateLimitStore.get(key) || { 
    requests: 0, 
    resetTime: now + RATE_LIMIT_WINDOW,
    authAttempts: 0 
  }

  // Check auth-specific rate limiting
  if (isAuthRequest && currentEntry.authAttempts >= RATE_LIMIT_AUTH_MAX) {
    return { allowed: false, remaining: 0 }
  }

  // Check general rate limiting
  if (currentEntry.requests >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  // Update counters
  currentEntry.requests++
  if (isAuthRequest) {
    currentEntry.authAttempts++
  }
  
  rateLimitStore.set(key, currentEntry)

  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX_REQUESTS - currentEntry.requests 
  }
}

function addSecurityHeaders(response: NextResponse, nonce?: string, cspHeaderValue?: string): NextResponse {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Add additional runtime security headers
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  
  // Cache control - more aggressive in development to prevent CSP cache issues
  if (isDevelopment) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Vary', 'Content-Security-Policy')
  } else {
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }
  
  // Add CSP header with XSS protection
  if (cspHeaderValue) {
    response.headers.set('Content-Security-Policy', cspHeaderValue)
  }
  
  // Add nonce header for scripts and styles (production only)
  if (nonce && !isDevelopment) {
    response.headers.set('x-nonce', nonce)
  }
  
  // Add security event headers for monitoring
  response.headers.set('X-Security-Check', 'passed')
  
  // Generate request ID using Web Crypto API for Edge Runtime compatibility
  const requestIdArray = new Uint8Array(16)
  crypto.getRandomValues(requestIdArray)
  const requestId = Array.from(requestIdArray, byte => byte.toString(16).padStart(2, '0')).join('')
  response.headers.set('X-Request-ID', requestId)
  
  return response
}

async function isValidAuthentication(authCookie: { value?: string } | undefined): Promise<boolean> {
  if (!authCookie?.value) {
    return false
  }
  
  // Handle legacy cookie format
  if (authCookie.value === 'authenticated') {
    return true
  }
  
  try {
    // First try parsing as legacy JSON session data
    const sessionData = JSON.parse(authCookie.value)
    const now = Date.now()
    
    // Check if session has expired
    if (sessionData.expires && now > sessionData.expires) {
      return false
    }
    
    return sessionData.value === 'authenticated'
  } catch (jsonError) {
    // If JSON parsing fails, try JWT token verification using Web Crypto API
    try {
      // JWT verification logic using Web Crypto API (Edge Runtime compatible)
      const parts = authCookie.value.split('.')
      if (parts.length !== 3) {
        return false
      }

      const [encodedHeader, encodedPayload, signature] = parts
      
      // Verify signature using Web Crypto API
      const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
      
      // Convert secret to key for HMAC
      const encoder = new TextEncoder()
      const keyData = encoder.encode(JWT_SECRET)
      
      // Create HMAC key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      
      // Sign the header and payload
      const signatureData = encoder.encode(`${encodedHeader}.${encodedPayload}`)
      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, signatureData)
      
      // Convert to base64url
      const signatureArray = new Uint8Array(signatureBuffer)
      const expectedSignature = btoa(String.fromCharCode(...signatureArray))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

      if (signature !== expectedSignature) {
        console.log('🔍 JWT signature mismatch')
        return false
      }

      // Decode payload
      const payload = JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')))

      // Check expiration
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp < now) {
        return false
      }

      return payload.sub === 'authenticated'
    } catch (jwtError) {
      return false
    }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authCookie = request.cookies.get(COOKIE_NAME)
  const isAuthenticated = await isValidAuthentication(authCookie)

  // Generate nonce for CSP security
  const nonce = generateNonce()
  const cspHeaderValue = generateCSPHeader(nonce)

  // Security validation: Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\.(\/|\\)/,  // Path traversal
    /<script/i,     // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i,   // JavaScript protocol
    /vbscript:/i,     // VBScript protocol
    /on\w+\s*=/i,     // Event handlers
  ]

  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(pathname) || 
    pattern.test(request.nextUrl.search) ||
    pattern.test(request.headers.get('user-agent') || '') ||
    pattern.test(request.headers.get('referer') || '')
  )

  if (isSuspicious) {
    console.warn('Suspicious request blocked:', {
      pathname,
      userAgent: request.headers.get('user-agent'),
      ip: getRateLimitKey(request),
      timestamp: new Date().toISOString()
    })
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Rate limiting check
  const rateLimitKey = getRateLimitKey(request)
  const isAuthRequest = pathname.startsWith('/api/gate')
  const { allowed, remaining } = checkRateLimit(rateLimitKey, isAuthRequest)

  if (!allowed) {
    console.warn('Rate limit exceeded:', {
      ip: rateLimitKey,
      pathname,
      timestamp: new Date().toISOString()
    })
    const response = new NextResponse('Too Many Requests', { status: 429 })
    response.headers.set('Retry-After', '900') // 15 minutes
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString())
    response.headers.set('X-RateLimit-Remaining', '0')
    response.headers.set('X-RateLimit-Reset', (Date.now() + RATE_LIMIT_WINDOW).toString())
    return response
  }

  // Allow public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    return addSecurityHeaders(response, nonce, cspHeaderValue)
  }

  // Allow static assets with additional security
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/favicon.ico') ||
      pathname.includes('.')) {
    const response = NextResponse.next()
    // Add security headers for static assets
    response.headers.set('X-Content-Type-Options', 'nosniff')
    return response
  }

  // Check if the path requires authentication
  const requiresAuth = PROTECTED_PATHS.some(path => 
    pathname === path || pathname.startsWith(path)
  )

  if (requiresAuth && !isAuthenticated) {
    // Log authentication attempt
    console.info('Unauthenticated access attempt:', {
      pathname,
      ip: rateLimitKey,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    })
    
    // Redirect to login page
    const loginUrl = new URL('/enter', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated and trying to access login page, redirect to home
  if (isAuthenticated && pathname === '/enter') {
    const homeUrl = new URL('/', request.url)
    return NextResponse.redirect(homeUrl)
  }

  // Add security headers to authenticated requests
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  return addSecurityHeaders(response, nonce, cspHeaderValue)
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