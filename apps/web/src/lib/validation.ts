import { z } from 'zod'

// Environment validation schema
export const envSchema = z.object({
  // Required environment variables
  NEXT_PUBLIC_SITE_NAME: z.string().min(1, 'Site name is required'),
  NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE: z.string().min(1, 'Cloudflare Stream customer code is required'),
  GATE_PASSWORD: z.string().min(8, 'Gate password must be at least 8 characters'),
  
  // Optional with defaults
  MEDIACMS_BASE_URL: z.string().url().optional().default('http://localhost:8000'),
  MEDIACMS_API_TOKEN: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
  
  // Security-related
  CF_ACCOUNT_ID: z.string().optional(),
  CF_STREAM_API_TOKEN: z.string().optional(),
  
  // Analytics (optional)
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_HOTJAR_ID: z.string().optional(),
  
  // Debug settings
  NEXT_PUBLIC_DEBUG: z.string().transform(val => val === 'true').optional().default(false),
})

// API request validation schemas
export const searchParamsSchema = z.object({
  search: z.string().max(100, 'Search query too long').optional(),
  creator: z.string().max(50, 'Creator name too long').optional(),
  price_min: z.coerce.number().min(0, 'Price must be positive').max(1000, 'Price too high').optional(),
  price_max: z.coerce.number().min(0, 'Price must be positive').max(1000, 'Price too high').optional(),
  length_min: z.coerce.number().min(0, 'Duration must be positive').max(1440, 'Duration too long').optional(),
  length_max: z.coerce.number().min(0, 'Duration must be positive').max(1440, 'Duration too long').optional(),
  is_featured: z.coerce.boolean().optional(),
  is_premium: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1, 'Page must be positive').max(1000, 'Page too high').optional(),
  limit: z.coerce.number().min(1, 'Limit must be positive').max(100, 'Limit too high').optional(),
})

// Video ID validation
export const videoIdSchema = z.object({
  id: z.string()
    .min(1, 'Video ID is required')
    .max(100, 'Video ID too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid video ID format'),
})

// Authentication validation
export const authRequestSchema = z.object({
  password: z.string()
    .min(1, 'Password is required')
    .max(200, 'Password too long'),
})

// Contact/Feedback form (if implemented)
export const contactSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email too long'),
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject too long'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message too long'),
})

// File upload validation (future use)
export const fileUploadSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename characters'),
  size: z.number()
    .min(1, 'File must have content')
    .max(100 * 1024 * 1024, 'File too large (max 100MB)'), // 100MB
  type: z.string()
    .regex(/^(image|video|audio|application)\/(jpeg|jpg|png|webp|mp4|webm|avi|mp3|wav|pdf|json)$/, 'Invalid file type'),
})

// API response validation helpers
export const paginatedResponseSchema = <T>(itemSchema: z.ZodSchema<T>) => 
  z.object({
    count: z.number().min(0),
    next: z.string().url().nullable(),
    previous: z.string().url().nullable(),
    results: z.array(itemSchema),
  })

// Trailer data validation (matching the API response)
export const trailerSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  detailed_description: z.string().optional(),
  creators: z.string(),
  price: z.string(),
  duration: z.string(),
  video_number: z.string(),
  cf_video_uid: z.string(),
  cf_thumb_uid: z.string().optional(),
  upload_status: z.enum(['Complete', 'Pending', 'Processing']),
  is_featured: z.boolean(),
  is_premium: z.boolean(),
  tags: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

// Security event validation
export const securityEventSchema = z.object({
  type: z.enum(['auth_success', 'auth_failure', 'lockout', 'suspicious_activity', 'session_expired', 'xss_attempt', 'injection_attempt']),
  ip: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/, 'Invalid IP address'),
  userAgent: z.string().optional(),
  timestamp: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Rate limiting validation
export const rateLimitSchema = z.object({
  ip: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/, 'Invalid IP address'),
  endpoint: z.string().min(1, 'Endpoint is required'),
  requests: z.number().min(0, 'Requests must be non-negative'),
  windowStart: z.number().min(0, 'Window start must be non-negative'),
  isBlocked: z.boolean(),
})

// JWT token validation
export const jwtPayloadSchema = z.object({
  sub: z.string().min(1, 'Subject is required'),
  iat: z.number().min(0, 'Issued at must be non-negative'),
  exp: z.number().min(0, 'Expiration must be non-negative'),
  jti: z.string().uuid('Invalid token ID'),
})

// DISABLE CSP AND NONCE VALIDATION FOR VIDEO STREAMING
// Content Security Policy nonce validation
// export const nonceSchema = z.object({
//   nonce: z.string()
//     .length(24, 'Nonce must be exactly 24 characters')
//     .regex(/^[A-Za-z0-9+/=]+$/, 'Invalid nonce format'),
// })

// Content Security Policy validation
// export const cspReportSchema = z.object({
//   'blocked-uri': z.string(),
//   'document-uri': z.string(),
//   'original-policy': z.string(),
//   'referrer': z.string().optional(),
//   'violated-directive': z.string(),
//   'source-file': z.string().optional(),
//   'line-number': z.number().optional(),
//   'column-number': z.number().optional(),
// })

// Health check response
export const healthCheckSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string(),
  version: z.string().optional(),
  uptime: z.number().min(0),
  checks: z.record(z.string(), z.object({
    status: z.enum(['pass', 'fail', 'warn']),
    message: z.string().optional(),
    duration_ms: z.number().min(0).optional(),
  })),
})

// Sanitization helpers
export const sanitizeString = (input: string, maxLength = 1000): string => {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
}

export const sanitizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .slice(0, 100)
    .replace(/[<>\"'&;(){}[\]]/g, '') // Remove script-dangerous characters
    .replace(/\s+/g, ' ') // Normalize whitespace
}

// URL validation helper
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

// Enhanced content validation for XSS and injection prevention
export const validateContent = (content: string): { 
  isValid: boolean; 
  sanitized: string; 
  issues: string[] 
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
} => {
  const issues: string[] = []
  let sanitized = content
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'

  // Critical risk patterns
  const criticalPatterns = [
    { pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/gi, name: 'Script tags' },
    { pattern: /javascript:/gi, name: 'JavaScript protocol' },
    { pattern: /vbscript:/gi, name: 'VBScript protocol' },
    { pattern: /data:\s*text\/html/gi, name: 'Data URL HTML' },
  ]

  // High risk patterns
  const highRiskPatterns = [
    { pattern: /on\w+\s*=/gi, name: 'Event handlers' },
    { pattern: /<iframe[\s\S]*?>/gi, name: 'Iframe tags' },
    { pattern: /<object[\s\S]*?>/gi, name: 'Object tags' },
    { pattern: /<embed[\s\S]*?>/gi, name: 'Embed tags' },
    { pattern: /expression\s*\(/gi, name: 'CSS expressions' },
  ]

  // Medium risk patterns
  const mediumRiskPatterns = [
    { pattern: /<form[\s\S]*?>/gi, name: 'Form tags' },
    { pattern: /<input[\s\S]*?>/gi, name: 'Input tags' },
    { pattern: /style\s*=\s*["'][^"']*["']/gi, name: 'Inline styles' },
  ]

  // SQL injection patterns
  const sqlInjectionPatterns = [
    { pattern: /union\s+select/gi, name: 'SQL Union' },
    { pattern: /insert\s+into/gi, name: 'SQL Insert' },
    { pattern: /delete\s+from/gi, name: 'SQL Delete' },
    { pattern: /drop\s+table/gi, name: 'SQL Drop' },
    { pattern: /--\s*$/gm, name: 'SQL Comments' },
  ]

  // Check patterns and assign risk levels
  for (const { pattern, name } of criticalPatterns) {
    if (pattern.test(content)) {
      issues.push(`Critical: ${name} detected`)
      riskLevel = 'critical'
    }
  }

  for (const { pattern, name } of highRiskPatterns) {
    if (pattern.test(content)) {
      issues.push(`High: ${name} detected`)
      if (riskLevel !== 'critical') riskLevel = 'high'
    }
  }

  for (const { pattern, name } of sqlInjectionPatterns) {
    if (pattern.test(content)) {
      issues.push(`Critical: ${name} detected`)
      riskLevel = 'critical'
    }
  }

  for (const { pattern, name } of mediumRiskPatterns) {
    if (pattern.test(content)) {
      issues.push(`Medium: ${name} detected`)
      if (riskLevel === 'low') riskLevel = 'medium'
    }
  }

  // Comprehensive sanitization
  sanitized = sanitized
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '') // Remove script tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/data:\s*text\/html/gi, '') // Remove data URL HTML
    .replace(/<iframe[\s\S]*?>/gi, '') // Remove iframes
    .replace(/<object[\s\S]*?>/gi, '') // Remove objects
    .replace(/<embed[\s\S]*?>/gi, '') // Remove embeds
    .replace(/expression\s*\(/gi, '') // Remove CSS expressions
    .replace(/--\s*$/gm, '') // Remove SQL comment indicators

  return {
    isValid: issues.length === 0,
    sanitized,
    issues,
    riskLevel
  }
}

// Enhanced IP validation
export const validateIP = (ip: string): { 
  isValid: boolean; 
  type: 'ipv4' | 'ipv6' | 'invalid'
  isPrivate: boolean
} => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  const privateIPv4Ranges = [
    /^10\./,
    /^172\.(?:1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./
  ]

  if (ipv4Regex.test(ip)) {
    const isPrivate = privateIPv4Ranges.some(range => range.test(ip))
    return { isValid: true, type: 'ipv4', isPrivate }
  }

  if (ipv6Regex.test(ip)) {
    const isPrivate = ip.startsWith('::1') || ip.startsWith('fc') || ip.startsWith('fd')
    return { isValid: true, type: 'ipv6', isPrivate }
  }

  return { isValid: false, type: 'invalid', isPrivate: false }
}

// Type exports for use in components
export type EnvConfig = z.infer<typeof envSchema>
export type SearchParams = z.infer<typeof searchParamsSchema>
export type VideoId = z.infer<typeof videoIdSchema>
export type AuthRequest = z.infer<typeof authRequestSchema>
export type ContactForm = z.infer<typeof contactSchema>
export type FileUpload = z.infer<typeof fileUploadSchema>
export type Trailer = z.infer<typeof trailerSchema>
export type SecurityEvent = z.infer<typeof securityEventSchema>
// export type CSPReport = z.infer<typeof cspReportSchema>
export type HealthCheck = z.infer<typeof healthCheckSchema>