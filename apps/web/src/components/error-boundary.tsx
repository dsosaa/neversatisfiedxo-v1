'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error?: Error
  resetError: () => void
  errorInfo?: React.ErrorInfo
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Provides user-friendly error messages and recovery options
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // reportError(error, errorInfo)
    }
  }

  handleResetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback
      
      return (
        <Fallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.handleResetError}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Default error fallback component with premium styling
 */
export function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            We encountered an unexpected error. This has been logged and our team will investigate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                Error Details (Development)
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-32">
                {error.toString()}
              </pre>
            </details>
          )}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={resetError}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <Button asChild size="sm" className="gap-2">
              <Link href="/">
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Video-specific error fallback for trailer components
 */
export function VideoErrorFallback({ error: _error, resetError }: ErrorFallbackProps) {
  return (
    <div className="aspect-video bg-muted rounded-2xl flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="font-semibold text-lg mb-2">Video Unavailable</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
        We&apos;re having trouble loading this video. Please try again.
      </p>
      <Button
        onClick={resetError}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </Button>
    </div>
  )
}

/**
 * Compact error fallback for smaller components
 */
export function CompactErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center p-4 bg-destructive/5 rounded-lg">
      <div className="text-center">
        <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-3">Something went wrong</p>
        <Button
          onClick={resetError}
          variant="outline"
          size="sm"
        >
          Retry
        </Button>
      </div>
    </div>
  )
}

/**
 * Hook to use error boundary in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { handleError, resetError }
}