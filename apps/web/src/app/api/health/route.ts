import { NextRequest, NextResponse } from 'next/server'
import { healthCheckSchema, envSchema } from '@/lib/validation'

let startTime = Date.now()

// Health check status type
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'
type CheckStatus = 'pass' | 'fail' | 'warn'

interface HealthCheck {
  status: CheckStatus
  message?: string
  duration_ms?: number
}

// Individual health checks
async function checkEnvironment(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const env = {
      NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
      NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE: process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE,
      GATE_PASSWORD: process.env.GATE_PASSWORD,
      MEDIACMS_BASE_URL: process.env.MEDIACMS_BASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    }

    const validation = envSchema.safeParse(env)
    const duration = Date.now() - start

    if (validation.success) {
      return {
        status: 'pass',
        message: 'All required environment variables present',
        duration_ms: duration
      }
    } else {
      const missingVars = validation.error.issues.map(issue => issue.path.join('.')).join(', ')
      return {
        status: 'fail',
        message: `Missing or invalid environment variables: ${missingVars}`,
        duration_ms: duration
      }
    }
  } catch (_error) {
    return {
      status: 'fail',
      message: `Environment check failed: ${_error instanceof Error ? _error.message : 'Unknown error'}`,
      duration_ms: Date.now() - start
    }
  }
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const baseUrl = process.env.MEDIACMS_BASE_URL || 'http://localhost:8000'
    
    // Test connection to MediaCMS backend
    const response = await fetch(`${baseUrl}/api/trailers/stats/`, {
      method: 'GET',
      headers: {
        'Authorization': process.env.MEDIACMS_API_TOKEN ? `Token ${process.env.MEDIACMS_API_TOKEN}` : '',
        'Content-Type': 'application/json',
      },
      // Short timeout for health checks
      signal: AbortSignal.timeout(5000)
    })

    const duration = Date.now() - start

    if (response.ok) {
      return {
        status: 'pass',
        message: 'Database connection successful',
        duration_ms: duration
      }
    } else if (response.status === 401) {
      return {
        status: 'warn',
        message: 'Database connection successful but authentication may be required',
        duration_ms: duration
      }
    } else {
      return {
        status: 'fail',
        message: `Database connection failed: HTTP ${response.status}`,
        duration_ms: duration
      }
    }
  } catch (_error) {
    return {
      status: 'fail',
      message: `Database connection failed: ${_error instanceof Error ? _error.message : 'Unknown error'}`,
      duration_ms: Date.now() - start
    }
  }
}

async function checkCloudflareStream(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const customerCode = process.env.NEXT_PUBLIC_CF_STREAM_CUSTOMER_CODE

    if (!customerCode) {
      return {
        status: 'fail',
        message: 'Cloudflare Stream customer code not configured',
        duration_ms: Date.now() - start
      }
    }

    // Test a known Cloudflare endpoint (this will likely fail but shows connectivity)
    const testUrl = 'https://videodelivery.net/ping'
    await fetch(testUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    })

    const duration = Date.now() - start

    // Even if this specific endpoint fails, we can verify the customer code format
    const isValidCustomerCode = /^[a-zA-Z0-9]{32}$/.test(customerCode)

    if (isValidCustomerCode) {
      return {
        status: 'pass',
        message: 'Cloudflare Stream configuration appears valid',
        duration_ms: duration
      }
    } else {
      return {
        status: 'warn',
        message: 'Cloudflare Stream customer code format may be invalid',
        duration_ms: duration
      }
    }
  } catch {
    return {
      status: 'warn',
      message: 'Cloudflare Stream connectivity test inconclusive',
      duration_ms: Date.now() - start
    }
  }
}

async function checkMemory(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024)
      const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024)
      const heapUsagePercent = Math.round((usage.heapUsed / usage.heapTotal) * 100)

      const duration = Date.now() - start

      if (heapUsagePercent > 90) {
        return {
          status: 'fail',
          message: `Critical memory usage: ${heapUsedMB}MB (${heapUsagePercent}%)`,
          duration_ms: duration
        }
      } else if (heapUsagePercent > 75) {
        return {
          status: 'warn',
          message: `High memory usage: ${heapUsedMB}MB (${heapUsagePercent}%)`,
          duration_ms: duration
        }
      } else {
        return {
          status: 'pass',
          message: `Memory usage normal: ${heapUsedMB}MB/${heapTotalMB}MB (${heapUsagePercent}%)`,
          duration_ms: duration
        }
      }
    } else {
      return {
        status: 'warn',
        message: 'Memory usage monitoring not available',
        duration_ms: Date.now() - start
      }
    }
  } catch (_error) {
    return {
      status: 'warn',
      message: `Memory check failed: ${_error instanceof Error ? _error.message : 'Unknown error'}`,
      duration_ms: Date.now() - start
    }
  }
}

// Determine overall health status
function determineOverallStatus(checks: Record<string, HealthCheck>): HealthStatus {
  const statuses = Object.values(checks).map(check => check.status)
  
  if (statuses.includes('fail')) {
    return 'unhealthy'
  } else if (statuses.includes('warn')) {
    return 'degraded'
  } else {
    return 'healthy'
  }
}

export async function GET(request: NextRequest) {
  const detailed = request.nextUrl.searchParams.get('detailed') === 'true'
  
  try {
    // Run all health checks in parallel for better performance
    const [envCheck, dbCheck, cfCheck, memCheck] = await Promise.all([
      checkEnvironment(),
      checkDatabase(),
      checkCloudflareStream(),
      checkMemory()
    ])

    const checks = {
      environment: envCheck,
      database: dbCheck,
      cloudflare: cfCheck,
      memory: memCheck
    }

    const overallStatus = determineOverallStatus(checks)
    const uptime = Date.now() - startTime

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime,
      checks: detailed ? checks : undefined
    }

    // Validate response structure
    const validatedResponse = healthCheckSchema.parse(
      detailed ? healthData : { ...healthData, checks: {} }
    )

    // Set appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503

    return NextResponse.json(validatedResponse, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (_error) {
    console.error('Health check failed:', _error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - startTime,
      checks: {
        system: {
          status: 'fail',
          message: `Health check system failure: ${_error instanceof Error ? _error.message : 'Unknown error'}`
        }
      }
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}

// Reset start time (for testing purposes)
export async function POST() {
  startTime = Date.now()
  return NextResponse.json({ 
    message: 'Health check start time reset',
    timestamp: new Date().toISOString()
  })
}