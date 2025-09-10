'use client'

import { useCallback } from 'react'
import { Search, Grid3X3, List, Filter, ChevronDown, Check } from '@/lib/icons'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { TrailerFilters } from '@/lib/types'

interface GalleryControlsProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'duration'
  onSortChange: (sort: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'duration') => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  filters: TrailerFilters
  onFiltersChange: (filters: TrailerFilters) => void
  onFilterToggle: () => void
}

export function GalleryControls({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  filters,
  onFiltersChange,
  onFilterToggle,
}: GalleryControlsProps) {
  const handleClearSearch = useCallback(() => {
    onSearchChange('')
  }, [onSearchChange])

  const handleClearFilter = useCallback((key: keyof TrailerFilters) => {
    onFiltersChange({ ...filters, [key]: undefined })
  }, [filters, onFiltersChange])

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
          <Input
            placeholder="Search trailers..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-12 rounded-2xl border-2 focus:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:border-primary/50 focus:shadow-lg focus:shadow-primary/30"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Filter Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={onFilterToggle}
            className="h-12 px-4 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 hover:border-primary/50 active:scale-95"
          >
            <Filter className="w-4 h-4 mr-2 text-primary transition-all duration-300 group-hover:rotate-12" />
            <span className="text-sm font-medium">Filters</span>
          </Button>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-12 px-4 rounded-2xl border-2 border-input bg-background text-sm font-medium focus:border-primary justify-between min-w-48 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 hover:border-primary/50 hover:bg-primary/5 active:scale-95 group"
              >
                <span>
                  {sortBy === 'newest' && 'Newest First'}
                  {sortBy === 'oldest' && 'Oldest First'}
                  {sortBy === 'price_low' && 'Price: Low to High'}
                  {sortBy === 'price_high' && 'Price: High to Low'}
                  {sortBy === 'duration' && 'Longest First'}
                </span>
                <ChevronDown className="w-4 h-4 ml-2 text-primary transition-all duration-300 group-hover:rotate-180 group-hover:text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-48 bg-black/90 backdrop-blur-xl border-2 border-white/20 rounded-2xl shadow-2xl"
              align="end"
            >
              {[
                { value: 'newest' as const, label: 'Newest First' },
                { value: 'oldest' as const, label: 'Oldest First' },
                { value: 'price_low' as const, label: 'Price: Low to High' },
                { value: 'price_high' as const, label: 'Price: High to Low' },
                { value: 'duration' as const, label: 'Longest First' },
              ].map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  className="cursor-pointer rounded-xl hover:bg-white/10 focus:bg-white/10 text-white/95 hover:text-white focus:text-white"
                  onClick={() => onSortChange(option.value)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{option.label}</span>
                    {sortBy === option.value && <Check className="w-4 h-4 text-blue-400" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-2xl border-2 border-input overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:border-primary/50">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="rounded-none h-12 px-4 transition-all duration-300 hover:scale-110 hover:bg-primary/10 active:scale-95 group"
            >
              <Grid3X3 className="w-4 h-4 text-primary transition-all duration-300 group-hover:rotate-12" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="rounded-none h-12 px-4 transition-all duration-300 hover:scale-110 hover:bg-primary/10 active:scale-95 group"
            >
              <List className="w-4 h-4 text-primary transition-all duration-300 group-hover:scale-110" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active filters display */}
      {(searchQuery || Object.keys(filters).length > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <button onClick={handleClearSearch} className="ml-1 hover:text-destructive">
                ×
              </button>
            </Badge>
          )}
          {Object.entries(filters).map(([key, value]) => (
            value && (
              <Badge key={key} variant="secondary" className="gap-1">
                {key}: {value}
                <button 
                  onClick={() => handleClearFilter(key as keyof TrailerFilters)}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )
          ))}
        </div>
      )}
    </div>
  )
}