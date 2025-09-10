import { NextRequest, NextResponse } from 'next/server'
import { 
  passwordSchema, 
  getClientIP, 
  isLockedOut, 
  recordFailedAttempt,
  clearFailedAttempts,
  createAuthCookie,
  verifyAuthCookie,
  validateAuthEnvironment,
  logSecurityEvent,
  hashPassword,
  verifyPassword
} from '@/lib/auth'
import { ZodError } from 'zod'

// Pre-hash the password on server startup for constant-time comparison
let HASHED_GATE_PASSWORD: string | null = null

// Initialize hashed password
async function initializeAuth() {
  if (!HASHED_GATE_PASSWORD && process.env.GATE_PASSWORD) {
    HASHED_GATE_PASSWORD = await hashPassword(process.env.GATE_PASSWORD)
  }
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    // Initialize authentication system
    await initializeAuth()

    // Validate environment
    const envValidation = validateAuthEnvironment()
    if (!envValidation.isValid) {
      console.error('Authentication environment validation failed:', envValidation.errors)
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Check if IP is locked out
    if (isLockedOut(clientIP)) {
      logSecurityEvent({
        type: 'lockout',
        ip: clientIP,
        userAgent,
        timestamp: new Date().toISOString(),
        metadata: { reason: 'IP locked due to failed attempts' }
      })

      return NextResponse.json(
        { 
          success: false, 
          message: 'Too many failed attempts. Please try again later.',
          lockedOut: true 
        },
        { status: 429 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      logSecurityEvent({
        type: 'suspicious_activity',
        ip: clientIP,
        userAgent,
        timestamp: new Date().toISOString(),
        metadata: { 
          error: parseError instanceof Error ? parseError.message : 'JSON parse error',
          action: 'malformed_request_body'
        }
      })
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid request format - malformed JSON' 
        },
        { status: 400 }
      )
    }

    const validationResult = passwordSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid request format',
          errors: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const { password } = validationResult.data

    if (!HASHED_GATE_PASSWORD) {
      console.error('GATE_PASSWORD not properly initialized')
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Verify password using constant-time comparison
    const isValidPassword = await verifyPassword(password, HASHED_GATE_PASSWORD)

    if (isValidPassword) {
      // Clear any failed attempts for this IP
      clearFailedAttempts(clientIP)

      // Create secure authentication cookie
      await createAuthCookie('authenticated')

      // Log successful authentication
      logSecurityEvent({
        type: 'auth_success',
        ip: clientIP,
        userAgent,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        message: 'Authentication successful'
      })
    } else {
      // Record failed attempt and get remaining attempts
      const { attemptsRemaining, lockedUntil } = recordFailedAttempt(clientIP)

      // Log failed authentication attempt
      logSecurityEvent({
        type: 'auth_failure',
        ip: clientIP,
        userAgent,
        timestamp: new Date().toISOString(),
        metadata: { 
          attemptsRemaining,
          lockedUntil: lockedUntil ? new Date(lockedUntil).toISOString() : undefined
        }
      })

      const message = lockedUntil 
        ? 'Too many failed attempts. Account temporarily locked.'
        : `Incorrect password. ${attemptsRemaining} attempts remaining.`

      return NextResponse.json(
        { 
          success: false, 
          message,
          attemptsRemaining: lockedUntil ? 0 : attemptsRemaining,
          lockedUntil: lockedUntil ? new Date(lockedUntil).toISOString() : undefined
        },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Gate API error:', error)

    // Log security event for server errors
    logSecurityEvent({
      type: 'suspicious_activity',
      ip: clientIP,
      userAgent,
      timestamp: new Date().toISOString(),
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
    })

    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid request format',
          errors: error.issues 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET method to check authentication status with session validation
export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request)

  try {
    const { isValid, isExpired } = await verifyAuthCookie()

    if (isExpired) {
      logSecurityEvent({
        type: 'session_expired',
        ip: clientIP,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      authenticated: isValid,
      sessionExpired: isExpired
    })
  } catch (error) {
    console.error('Gate status check error:', error)
    return NextResponse.json(
      { success: false, authenticated: false },
      { status: 500 }
    )
  }
}

// DELETE method to logout
export async function DELETE(request: NextRequest) {
  const clientIP = getClientIP(request)

  try {
    // Clear authentication cookie
    const cookieStore = await (await import('next/headers')).cookies()
    cookieStore.delete('nsx_gate')

    logSecurityEvent({
      type: 'auth_success',
      ip: clientIP,
      timestamp: new Date().toISOString(),
      metadata: { action: 'logout' }
    })

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}