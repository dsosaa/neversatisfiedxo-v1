import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import crypto from 'crypto'

// Authentication configuration
export const AUTH_CONFIG = {
  COOKIE_NAME: 'nsx_gate',
  COOKIE_MAX_AGE: 30 * 24 * 60 * 60, // 30 days in seconds
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  BCRYPT_ROUNDS: 12,
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  JWT_ALGORITHM: 'HS256',
} as const

// Token payload interface
interface TokenPayload {
  sub: string // subject (user identifier)
  iat: number // issued at
  exp: number // expires at
  jti: string // JWT ID (unique token identifier)
}

// Validation schemas
export const passwordSchema = z.object({
  password: z.string()
    .min(1, 'Password is required')
    .max(100, 'Password too long')
})

// In-memory failed attempts store (use Redis/database in production)
const failedAttempts = new Map<string, { 
  count: number; 
  lastAttempt: number; 
  lockedUntil?: number 
}>()

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, AUTH_CONFIG.BCRYPT_ROUNDS)
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate secure JWT token for authentication
 */
export function generateSecureToken(subject: string = 'authenticated'): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: TokenPayload = {
    sub: subject,
    iat: now,
    exp: now + Math.floor(AUTH_CONFIG.SESSION_TIMEOUT / 1000), // Convert to seconds
    jti: crypto.randomUUID() // Unique token ID
  }

  // Create JWT manually with proper HMAC signing
  const header = {
    alg: AUTH_CONFIG.JWT_ALGORITHM,
    typ: 'JWT'
  }

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  
  const signature = crypto
    .createHmac('sha256', AUTH_CONFIG.JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url')

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

/**
 * Verify JWT token and extract payload
 */
export function verifySecureToken(token: string): { 
  isValid: boolean; 
  isExpired: boolean; 
  payload?: TokenPayload 
} {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { isValid: false, isExpired: false }
    }

    const [encodedHeader, encodedPayload, signature] = parts
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', AUTH_CONFIG.JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url')

    if (signature !== expectedSignature) {
      return { isValid: false, isExpired: false }
    }

    // Decode payload
    const payload: TokenPayload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString()
    )

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      return { isValid: false, isExpired: true, payload }
    }

    return { isValid: true, isExpired: false, payload }
  } catch (error) {
    console.error('Token verification error:', error)
    return { isValid: false, isExpired: false }
  }
}

/**
 * Get client IP address for rate limiting
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0]?.trim() || realIp || 'unknown'
}

/**
 * Check if IP is locked out due to failed attempts
 */
export function isLockedOut(ip: string): boolean {
  const attempts = failedAttempts.get(ip)
  if (!attempts) return false

  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    return true
  }

  // Clear expired lockout
  if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
    failedAttempts.delete(ip)
    return false
  }

  return false
}

/**
 * Record failed authentication attempt
 */
export function recordFailedAttempt(ip: string): { 
  attemptsRemaining: number; 
  lockedUntil?: number 
} {
  const now = Date.now()
  const attempts = failedAttempts.get(ip) || { count: 0, lastAttempt: now }

  // Reset count if last attempt was more than lockout duration ago
  if (now - attempts.lastAttempt > AUTH_CONFIG.LOCKOUT_DURATION) {
    attempts.count = 0
  }

  attempts.count++
  attempts.lastAttempt = now

  // Lock out if max attempts reached
  if (attempts.count >= AUTH_CONFIG.MAX_FAILED_ATTEMPTS) {
    attempts.lockedUntil = now + AUTH_CONFIG.LOCKOUT_DURATION
  }

  failedAttempts.set(ip, attempts)

  return {
    attemptsRemaining: Math.max(0, AUTH_CONFIG.MAX_FAILED_ATTEMPTS - attempts.count),
    lockedUntil: attempts.lockedUntil
  }
}

/**
 * Clear failed attempts on successful login
 */
export function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip)
}

/**
 * Create secure authentication cookie with JWT token
 */
export async function createAuthCookie(value: string = 'authenticated'): Promise<void> {
  const cookieStore = await cookies()
  
  // Generate secure JWT token
  const secureToken = generateSecureToken(value)

  cookieStore.set(AUTH_CONFIG.COOKIE_NAME, secureToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: AUTH_CONFIG.COOKIE_MAX_AGE,
    path: '/',
  })
}

/**
 * Verify authentication cookie and session validity using JWT
 */
export async function verifyAuthCookie(): Promise<{ 
  isValid: boolean; 
  isExpired: boolean; 
  value?: string 
}> {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get(AUTH_CONFIG.COOKIE_NAME)

    if (!authCookie?.value) {
      return { isValid: false, isExpired: false }
    }

    // Handle legacy cookie format for backward compatibility
    if (authCookie.value === 'authenticated') {
      return { isValid: true, isExpired: false, value: 'authenticated' }
    }

    // Try to parse as legacy JSON format
    try {
      const legacyData = JSON.parse(authCookie.value)
      if (legacyData.value && legacyData.expires) {
        const now = Date.now()
        if (now > legacyData.expires) {
          cookieStore.delete(AUTH_CONFIG.COOKIE_NAME)
          return { isValid: false, isExpired: true }
        }
        return { isValid: legacyData.value === 'authenticated', isExpired: false, value: legacyData.value }
      }
    } catch {
      // Not legacy JSON format, continue with JWT verification
    }

    // Verify JWT token
    const tokenVerification = verifySecureToken(authCookie.value)
    
    if (tokenVerification.isExpired) {
      // Delete expired cookie
      cookieStore.delete(AUTH_CONFIG.COOKIE_NAME)
      return { isValid: false, isExpired: true }
    }

    return { 
      isValid: tokenVerification.isValid, 
      isExpired: false,
      value: tokenVerification.payload?.sub 
    }
  } catch (error) {
    console.error('Error verifying auth cookie:', error)
    return { isValid: false, isExpired: false }
  }
}

/**
 * Clear authentication cookie
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_CONFIG.COOKIE_NAME)
}

/**
 * Environment variable validation for authentication
 */
export function validateAuthEnvironment(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = []

  if (!process.env.GATE_PASSWORD) {
    errors.push('GATE_PASSWORD environment variable is required')
  } else if (process.env.GATE_PASSWORD.length < 8) {
    errors.push('GATE_PASSWORD must be at least 8 characters long')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Security event logging structure
 */
export interface SecurityEvent {
  type: 'auth_success' | 'auth_failure' | 'lockout' | 'suspicious_activity' | 'session_expired'
  ip: string
  userAgent?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

/**
 * Log security events (extend with external logging service)
 */
export function logSecurityEvent(event: SecurityEvent): void {
  console.info('Security Event:', {
    ...event,
    timestamp: new Date(event.timestamp).toISOString()
  })

  // TODO: Integrate with external logging service (e.g., Sentry, LogRocket)
  // await sendToSecurityLog(event)
}