'use client'

import { useState, useMemo, useCallback, lazy, Suspense } from 'react'
import { GalleryControls } from '@/components/gallery-controls'
import { TrailerDisplay } from '@/components/trailer-display'
import type { FilterOptions } from '@/components/filter-sidebar'
import { useTrailers, useSearchTrailers } from '@/lib/hooks'
import type { Trailer, TrailerFilters } from '@/lib/types'
import { parsePrice, parseLength } from '@/lib/api'
import { useDebounce } from '@/lib/use-debounce'

// Lazy load heavy components to reduce initial bundle size
const FilterSidebar = lazy(() => import('@/components/filter-sidebar').then(module => ({
  default: module.FilterSidebar
})))

// Loading skeleton for FilterSidebar
function FilterSidebarSkeleton({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border animate-pulse">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-muted rounded w-20" />
            <button onClick={onClose} className="h-6 w-6 bg-muted rounded" />
          </div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-10 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface GalleryProviderProps {
  initialData?: {
    results: Trailer[]
    count: number
    next?: string
    previous?: string
  }
}

export function GalleryProvider({ initialData }: GalleryProviderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<TrailerFilters>({})
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_low' | 'price_high' | 'duration'>('oldest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false)
  const [_activeFilters, setActiveFilters] = useState<FilterOptions>({
    selectedPriceRanges: [],
    durationRange: [0, 60],
    creators: [],
    dateRange: 'all'
  })

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Fetch data - always call both hooks but enable conditionally
  const searchEnabled = searchQuery.trim().length > 2
  const { data: searchData, isLoading: searchLoading, error: searchError } = useSearchTrailers(debouncedSearchQuery, searchEnabled)
  const { data: trailersData, isLoading: trailersLoading, error: trailersError } = useTrailers(filters)

  // Use search data if searching, otherwise use filtered trailers, fallback to initial data
  const finalData = searchEnabled ? searchData : trailersData || initialData
  const isLoading = searchEnabled ? searchLoading : trailersLoading
  const error = searchEnabled ? searchError : trailersError

  // Note: Latest video number is now calculated server-side

  // Sort trailers
  const sortedTrailers = useMemo(() => {
    if (!finalData?.results) return []

    const trailers = [...finalData.results]

    // Apply sorting
    return trailers.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.video_number || 0) - (a.video_number || 0)
        case 'oldest':
          return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
        case 'price_low':
          return parsePrice(a.price) - parsePrice(b.price)
        case 'price_high':
          return parsePrice(b.price) - parsePrice(a.price)
        case 'duration':
          return parseLength(b.length) - parseLength(a.length)
        default:
          return 0
      }
    })
  }, [finalData?.results, sortBy])

  const handleFilterApply = useCallback((newFilters: FilterOptions) => {
    setActiveFilters(newFilters)
    // Convert FilterOptions to TrailerFilters format
    const apiFilters: TrailerFilters = {}
    
    if (newFilters.selectedPriceRanges.includes('free')) {
      apiFilters.price_max = 0
    }
    
    setFilters(apiFilters)
  }, [])

  const handleFilterToggle = useCallback(() => {
    setFilterSidebarOpen(!filterSidebarOpen)
  }, [filterSidebarOpen])

  return (
    <div className="space-y-6">
      <GalleryControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filters={filters}
        onFiltersChange={setFilters}
        onFilterToggle={handleFilterToggle}
      />

      <TrailerDisplay
        trailers={sortedTrailers}
        isLoading={isLoading}
        error={error}
        viewMode={viewMode}
        searchQuery={searchQuery}
      />

      <Suspense 
        fallback={
          <FilterSidebarSkeleton 
            isOpen={filterSidebarOpen} 
            onClose={() => setFilterSidebarOpen(false)} 
          />
        }
      >
        <FilterSidebar
          isOpen={filterSidebarOpen}
          onClose={() => setFilterSidebarOpen(false)}
          onApply={handleFilterApply}
          availableCreators={finalData?.results ? [...new Set(finalData.results.map(t => t.creators))] : []}
        />
      </Suspense>
    </div>
  )
}