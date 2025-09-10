/**
 * Comprehensive monitoring and error tracking system
 * Designed for production deployment with external service integration
 */

// Error types and interfaces
export interface ErrorEvent {
  id: string
  timestamp: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  stack?: string
  url: string
  userAgent: string
  userId?: string
  sessionId: string
  metadata: Record<string, unknown>
  fingerprint?: string
}

export interface PerformanceMetric {
  id: string
  timestamp: string
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | '%'
  route: string
  metadata: Record<string, unknown>
}

export interface SecurityEvent {
  id: string
  timestamp: string
  type: 'auth_failure' | 'suspicious_activity' | 'rate_limit' | 'csp_violation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  ip: string
  userAgent: string
  details: Record<string, unknown>
}

// Configuration
const MONITORING_CONFIG = {
  MAX_ERRORS_PER_SESSION: 50,
  MAX_PERFORMANCE_ENTRIES: 100,
  BATCH_SIZE: 10,
  FLUSH_INTERVAL: 30000, // 30 seconds
  ENABLE_CONSOLE_LOGS: process.env.NODE_ENV === 'development',
  SAMPLE_RATE: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% sampling in prod
} as const

// In-memory storage (replace with external service in production)
class MonitoringStore {
  private errors: ErrorEvent[] = []
  private metrics: PerformanceMetric[] = []
  private securityEvents: SecurityEvent[] = []
  private sessionId: string = this.generateSessionId()

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Error tracking
  addError(error: Omit<ErrorEvent, 'id' | 'timestamp' | 'sessionId'>): void {
    if (this.errors.length >= MONITORING_CONFIG.MAX_ERRORS_PER_SESSION) {
      this.errors.shift() // Remove oldest error
    }

    const errorEvent: ErrorEvent = {
      ...error,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    }

    this.errors.push(errorEvent)
    
    if (MONITORING_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.error('Error tracked:', errorEvent)
    }

    // TODO: Send to external service (Sentry, LogRocket, etc.)
    this.sendToExternalService('error', errorEvent)
  }

  // Performance tracking
  addMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    if (Math.random() > MONITORING_CONFIG.SAMPLE_RATE) {
      return // Skip based on sampling rate
    }

    if (this.metrics.length >= MONITORING_CONFIG.MAX_PERFORMANCE_ENTRIES) {
      this.metrics.shift() // Remove oldest metric
    }

    const performanceMetric: PerformanceMetric = {
      ...metric,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    }

    this.metrics.push(performanceMetric)

    if (MONITORING_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.info('Performance metric:', performanceMetric)
    }

    // TODO: Send to external service
    this.sendToExternalService('performance', performanceMetric)
  }

  // Security event tracking
  addSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    }

    this.securityEvents.push(securityEvent)

    console.warn('Security event:', securityEvent)

    // Always send security events regardless of sampling
    this.sendToExternalService('security', securityEvent)
  }

  // External service integration placeholder
  private async sendToExternalService(
    type: 'error' | 'performance' | 'security',
    data: unknown
  ): Promise<void> {
    // TODO: Implement actual external service integration
    // Examples:
    // - Sentry: Sentry.captureException(error)
    // - LogRocket: LogRocket.captureException(error)
    // - DataDog: datadogRum.addError(error)
    // - Custom webhook/API endpoint

    if (process.env.MONITORING_WEBHOOK_URL) {
      try {
        await fetch(process.env.MONITORING_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, data }),
        })
      } catch (error) {
        console.error('Failed to send to monitoring service:', error)
      }
    }
  }

  // Data retrieval methods
  getErrors(): ErrorEvent[] {
    return [...this.errors]
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents]
  }

  // Clear data
  clear(): void {
    this.errors = []
    this.metrics = []
    this.securityEvents = []
  }
}

// Global monitoring instance
const monitoringStore = new MonitoringStore()

// Error tracking functions
export function trackError(error: Error, context?: Record<string, unknown>): void {
  const errorEvent = {
    level: 'error' as const,
    message: error.message,
    stack: error.stack,
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    metadata: {
      context,
      timestamp: Date.now(),
    },
    fingerprint: generateErrorFingerprint(error),
  }

  monitoringStore.addError(errorEvent)
}

export function trackCustomError(
  message: string, 
  level: 'error' | 'warn' | 'info' = 'error',
  metadata?: Record<string, unknown>
): void {
  const errorEvent = {
    level,
    message,
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    metadata: metadata || {},
  }

  monitoringStore.addError(errorEvent)
}

// Performance tracking functions
export function trackPerformanceMetric(
  name: string,
  value: number,
  unit: PerformanceMetric['unit'] = 'ms',
  metadata?: Record<string, unknown>
): void {
  const metric = {
    name,
    value,
    unit,
    route: typeof window !== 'undefined' ? window.location.pathname : 'server',
    metadata: metadata || {},
  }

  monitoringStore.addMetric(metric)
}

export function trackPageLoad(): void {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    if (navigation) {
      trackPerformanceMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart, 'ms', {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstPaint: getFirstPaint(),
        firstContentfulPaint: getFirstContentfulPaint(),
      })
    }
  }
}

export function trackApiCall(
  url: string, 
  method: string, 
  duration: number, 
  status: number,
  success: boolean
): void {
  trackPerformanceMetric('api_call', duration, 'ms', {
    url,
    method,
    status,
    success,
  })

  if (!success) {
    trackCustomError(`API call failed: ${method} ${url}`, 'warn', {
      status,
      duration,
    })
  }
}

// Web Vitals tracking
export function trackWebVitals(): void {
  if (typeof window === 'undefined') return

  // Core Web Vitals
  try {
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS((metric: { value: number }) => trackPerformanceMetric('cls', metric.value, 'count', metric))
      onINP((metric: { value: number }) => trackPerformanceMetric('inp', metric.value, 'ms', metric))
      onFCP((metric: { value: number }) => trackPerformanceMetric('fcp', metric.value, 'ms', metric))
      onLCP((metric: { value: number }) => trackPerformanceMetric('lcp', metric.value, 'ms', metric))
      onTTFB((metric: { value: number }) => trackPerformanceMetric('ttfb', metric.value, 'ms', metric))
    })
  } catch (error) {
    console.warn('Web Vitals not available:', error)
  }
}

// Security event tracking
export function trackSecurityEvent(
  type: SecurityEvent['type'],
  severity: SecurityEvent['severity'],
  ip: string,
  userAgent: string,
  details: Record<string, unknown>
): void {
  monitoringStore.addSecurityEvent({
    type,
    severity,
    ip,
    userAgent,
    details,
  })
}

// Utility functions
function generateErrorFingerprint(error: Error): string {
  const key = `${error.name}-${error.message}-${error.stack?.split('\n')[1]?.trim()}`
  return btoa(key).substring(0, 16)
}

function getFirstPaint(): number | undefined {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    return firstPaint?.startTime
  }
  return undefined
}

function getFirstContentfulPaint(): number | undefined {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    return fcp?.startTime
  }
  return undefined
}

// Global error handlers
export function setupGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    trackError(new Error(event.reason), {
      type: 'unhandled_promise_rejection',
      promise: event.promise,
    })
  })

  // Global error handler
  window.addEventListener('error', (event) => {
    trackError(event.error || new Error(event.message), {
      type: 'global_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  // CSP violations
  document.addEventListener('securitypolicyviolation', (event) => {
    trackSecurityEvent(
      'csp_violation',
      'medium',
      'client',
      navigator.userAgent,
      {
        violatedDirective: event.violatedDirective,
        blockedURI: event.blockedURI,
        documentURI: event.documentURI,
        originalPolicy: event.originalPolicy,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
      }
    )
  })
}

// React error boundary helper
export function createErrorBoundaryHandler() {
  return (error: Error, errorInfo: { componentStack: string }) => {
    trackError(error, {
      type: 'react_error_boundary',
      componentStack: errorInfo.componentStack,
    })
  }
}

// Data export functions (for debugging)
export function exportMonitoringData() {
  return {
    errors: monitoringStore.getErrors(),
    metrics: monitoringStore.getMetrics(),
    securityEvents: monitoringStore.getSecurityEvents(),
  }
}

export function clearMonitoringData(): void {
  monitoringStore.clear()
}

// Health check integration
export function getSystemHealth() {
  const errors = monitoringStore.getErrors()
  const recentErrors = errors.filter(
    error => Date.now() - new Date(error.timestamp).getTime() < 300000 // 5 minutes
  )

  const securityEvents = monitoringStore.getSecurityEvents()
  const recentSecurityEvents = securityEvents.filter(
    event => Date.now() - new Date(event.timestamp).getTime() < 300000
  )

  return {
    totalErrors: errors.length,
    recentErrors: recentErrors.length,
    totalSecurityEvents: securityEvents.length,
    recentSecurityEvents: recentSecurityEvents.length,
    status: recentErrors.length > 10 || recentSecurityEvents.length > 5 ? 'degraded' : 'healthy',
  }
}