'use client'

import { useState, useCallback, lazy, Suspense } from 'react'
import { TrailerCard, TrailerCardSkeleton, TrailerGrid, TrailerList, TrailerListItem } from '@/components/trailer-card'
import { VirtualizedTrailerDisplay } from '@/components/virtualized-trailer-display'
import { m, motionPresets } from '@/lib/motion'
import type { Trailer } from '@/lib/types'

// Lazy load QuickPreview to reduce initial bundle size
const QuickPreview = lazy(() => import('@/components/quick-preview').then(module => ({
  default: module.QuickPreview
})))

// Loading skeleton for QuickPreview - mimics the modal structure
function QuickPreviewSkeleton({ 
  open, 
  onOpenChange 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void 
}) {
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-pulse">
        {/* Close button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => onOpenChange(false)}
            className="w-10 h-10 rounded-full bg-muted"
          />
        </div>
        
        {/* Video skeleton */}
        <div className="aspect-video bg-muted" />
        
        {/* Content skeleton */}
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 bg-muted rounded w-32" />
            <div className="h-8 bg-muted rounded w-20" />
          </div>
          <div className="h-10 bg-muted rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </div>
    </div>
  )
}

interface TrailerDisplayProps {
  trailers: Trailer[]
  isLoading: boolean
  error: Error | null
  viewMode: 'grid' | 'list'
  searchQuery?: string
}

export function TrailerDisplay({ 
  trailers, 
  isLoading, 
  error, 
  viewMode,
  searchQuery 
}: TrailerDisplayProps) {
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const handlePreview = useCallback((trailer: Trailer) => {
    setSelectedTrailer(trailer)
    setPreviewOpen(true)
  }, [])

  const handleClosePreview = useCallback(() => {
    setPreviewOpen(false)
    setTimeout(() => setSelectedTrailer(null), 300)
  }, [])

  if (isLoading) {
    return viewMode === 'grid' ? (
      <TrailerGrid>
        {Array.from({ length: 8 }, (_, i) => (
          <TrailerCardSkeleton key={i} />
        ))}
      </TrailerGrid>
    ) : (
      <TrailerList>
        {Array.from({ length: 4 }, (_, i) => (
          <TrailerCardSkeleton key={i} />
        ))}
      </TrailerList>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Failed to load trailers. Please try again.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  if (trailers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          {searchQuery ? 'No trailers found matching your search.' : 'No trailers available.'}
        </p>
        {searchQuery && (
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Clear Search
          </button>
        )}
      </div>
    )
  }

  // Disable virtualization for better UX - 169 items is manageable for modern browsers
  const useVirtualization = false // trailers.length > 200
  
  return (
    <>
      {useVirtualization ? (
        // Virtualized display for large lists (>50 items)
        <VirtualizedTrailerDisplay
          trailers={trailers}
          isLoading={isLoading}
          viewMode={viewMode}
          onPreview={handlePreview}
          className="w-full"
        />
      ) : (
        // Standard display for smaller lists (≤50 items)
        <>
          {viewMode === 'grid' ? (
            <TrailerGrid>
              {trailers.map((trailer, index) => (
                <m.div
                  key={trailer.id}
                  {...motionPresets.slideUp}
                  transition={{ 
                    duration: 0.3,
                    delay: index * 0.02 
                  }}
                >
                  <TrailerCard
                    trailer={trailer}
                    onPreview={handlePreview}
                  />
                </m.div>
              ))}
            </TrailerGrid>
          ) : (
            <TrailerList>
              {trailers.map((trailer, index) => (
                <m.div
                  key={trailer.id}
                  {...motionPresets.slideLeft}
                  transition={{ 
                    duration: 0.3,
                    delay: index * 0.02 
                  }}
                >
                  <TrailerListItem
                    trailer={trailer}
                    onPreview={handlePreview}
                  />
                </m.div>
              ))}
            </TrailerList>
          )}
        </>
      )}

      {/* Quick Preview Dialog */}
      <Suspense
        fallback={
          <QuickPreviewSkeleton
            open={previewOpen}
            onOpenChange={handleClosePreview}
          />
        }
      >
        <QuickPreview
          trailer={selectedTrailer}
          open={previewOpen}
          onOpenChange={handleClosePreview}
        />
      </Suspense>
    </>
  )
}