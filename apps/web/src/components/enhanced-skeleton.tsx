'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'default' | 'shimmer' | 'pulse'
  children?: React.ReactNode
}

export function Skeleton({ className, variant = 'shimmer', children }: SkeletonProps) {
  const baseClasses = "bg-muted rounded-md"
  
  const variantClasses = {
    default: "animate-pulse",
    shimmer: "relative overflow-hidden animate-pulse",
    pulse: "animate-pulse"
  }
  
  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {variant === 'shimmer' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
      )}
      {children}
    </div>
  )
}

interface ThumbnailSkeletonProps {
  className?: string
  showRetry?: boolean
  onRetry?: () => void
}

export function ThumbnailSkeleton({ className, showRetry, onRetry }: ThumbnailSkeletonProps) {
  return (
    <div className={cn("relative bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center", className)}>
      <Skeleton variant="shimmer" className="absolute inset-0 rounded-xl" />
      <div className="relative z-10 text-center space-y-3 p-4">
        <div className="w-12 h-12 mx-auto bg-muted-foreground/20 rounded-full flex items-center justify-center">
          <svg 
            className="w-6 h-6 text-muted-foreground/40" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="space-y-1">
          {showRetry && (
            <>
              <p className="text-xs text-muted-foreground/60 font-medium">Failed to load thumbnail</p>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  onRetry?.()
                }}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium transition-colors"
              >
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}