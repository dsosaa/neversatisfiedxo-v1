// Frontend Monitoring and Error Tracking System
interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

interface PerformanceMetric {
  id: string;
  timestamp: string;
  type: 'pageLoad' | 'apiCall' | 'userInteraction';
  name: string;
  duration: number;
  url: string;
  metadata?: Record<string, unknown>;
}

class MonitoringService {
  private errors: ErrorLog[] = [];
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupErrorHandlers();
    this.setupPerformanceTracking();
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set user ID for tracking
  setUserId(userId: string) {
    this.userId = userId;
  }

  // Setup global error handlers
  private setupErrorHandlers() {
    if (typeof window !== 'undefined') {
      // JavaScript errors
      window.addEventListener('error', (event) => {
        this.logError({
          level: 'error',
          message: event.message,
          stack: event.error?.stack,
          url: event.filename,
          userAgent: navigator.userAgent,
          metadata: {
            line: event.lineno,
            column: event.colno,
            type: 'javascript',
          },
        });
      });

      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.logError({
          level: 'error',
          message: `Unhandled Promise Rejection: ${event.reason}`,
          stack: event.reason?.stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: {
            type: 'promise_rejection',
            reason: event.reason,
          },
        });
      });

      // Console errors
      const originalConsoleError = console.error;
      console.error = (...args) => {
        this.logError({
          level: 'error',
          message: args.join(' '),
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: {
            type: 'console_error',
            args: args,
          },
        });
        originalConsoleError.apply(console, args);
      };
    }
  }

  // Setup performance tracking
  private setupPerformanceTracking() {
    if (typeof window !== 'undefined') {
      // Page load performance
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.recordMetric({
            type: 'pageLoad',
            name: 'page_load',
            duration: navigation.loadEventEnd - navigation.loadEventStart,
            url: window.location.href,
            metadata: {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              firstPaint: this.getFirstPaint(),
              firstContentfulPaint: this.getFirstContentfulPaint(),
            },
          });
        }
      });

      // Long task detection
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.recordMetric({
                type: 'userInteraction',
                name: 'long_task',
                duration: entry.duration,
                url: window.location.href,
                metadata: {
                  startTime: entry.startTime,
                  type: 'long_task',
                },
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      }
    }
  }

  // Get First Paint time
  private getFirstPaint(): number | null {
    if (typeof window === 'undefined') return null;
    
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  // Get First Contentful Paint time
  private getFirstContentfulPaint(): number | null {
    if (typeof window === 'undefined') return null;
    
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : null;
  }

  // Log error
  logError(error: Omit<ErrorLog, 'id' | 'timestamp' | 'sessionId' | 'userId'>) {
    const errorLog: ErrorLog = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...error,
    };

    this.errors.push(errorLog);
    
    // Keep only last 1000 errors
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000);
    }

    // Send to monitoring endpoint
    this.sendToMonitoring('error', errorLog);
  }

  // Record performance metric
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) {
    const performanceMetric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...metric,
    };

    this.metrics.push(performanceMetric);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Send to monitoring endpoint
    this.sendToMonitoring('metric', performanceMetric);
  }

  // Track API calls
  trackApiCall(url: string, method: string, duration: number, status: number) {
    this.recordMetric({
      type: 'apiCall',
      name: `api_${method.toLowerCase()}`,
      duration,
      url,
      metadata: {
        method,
        status,
        endpoint: url,
      },
    });
  }

  // Track user interactions
  trackUserInteraction(action: string, element: string, duration?: number) {
    this.recordMetric({
      type: 'userInteraction',
      name: action,
      duration: duration || 0,
      url: typeof window !== 'undefined' ? window.location.href : '',
      metadata: {
        element,
        action,
      },
    });
  }

  // Send data to monitoring endpoint
  private async sendToMonitoring(type: 'error' | 'metric', data: unknown) {
    try {
      await fetch('/api/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
        }),
      });
    } catch (error) {
      console.warn('Failed to send monitoring data:', error);
    }
  }

  // Get current metrics
  getMetrics() {
    return {
      errors: this.errors,
      metrics: this.metrics,
      sessionId: this.sessionId,
      userId: this.userId,
    };
  }

  // Clear metrics
  clearMetrics() {
    this.errors = [];
    this.metrics = [];
  }
}

// Create singleton instance
export const monitoring = new MonitoringService();

// Export types
export type { ErrorLog, PerformanceMetric };

// React hook for monitoring
export function useMonitoring() {
  return {
    logError: monitoring.logError.bind(monitoring),
    recordMetric: monitoring.recordMetric.bind(monitoring),
    trackApiCall: monitoring.trackApiCall.bind(monitoring),
    trackUserInteraction: monitoring.trackUserInteraction.bind(monitoring),
    setUserId: monitoring.setUserId.bind(monitoring),
    getMetrics: monitoring.getMetrics.bind(monitoring),
    clearMetrics: monitoring.clearMetrics.bind(monitoring),
  };
}