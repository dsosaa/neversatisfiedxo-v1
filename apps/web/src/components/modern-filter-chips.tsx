'use client'

import React from 'react'
import { X, DollarSign, Calendar, Plus } from '@/lib/icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type PriceRangeOption = 'free' | '15-below' | '20' | '25' | '30' | '40-plus'

export interface FilterOptions {
  selectedPriceRanges: PriceRangeOption[]
  creators: string[]
  selectedYears: number[]
}

interface ModernFilterChipsProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  availableCreators?: string[]
  className?: string
}

export function ModernFilterChips({
  filters,
  onFiltersChange,
  className
}: ModernFilterChipsProps) {

  const handleReset = () => {
    const resetFilters = {
      selectedPriceRanges: [],
      creators: [],
      selectedYears: []
    }
    onFiltersChange(resetFilters)
  }

  // Count active filters
  const activeFilterCount = 
    filters.selectedPriceRanges.length + 
    filters.creators.length + 
    filters.selectedYears.length

  const hasActiveFilters = activeFilterCount > 0

  // Quick price options (most common) - Light blue theme
  const quickPriceOptions = [
    { value: 'free' as const, label: 'FREE', color: 'bg-sky-500/20 text-sky-300 border-sky-400/30' },
    { value: '15-below' as const, label: '$15<', color: 'bg-sky-500/20 text-sky-300 border-sky-400/30' },
    { value: '20' as const, label: '$20', color: 'bg-sky-500/20 text-sky-300 border-sky-400/30' },
    { value: '25' as const, label: '$25', color: 'bg-sky-500/20 text-sky-300 border-sky-400/30' },
    { value: '30' as const, label: '$30+', color: 'bg-sky-500/20 text-sky-300 border-sky-400/30' },
    { value: '40-plus' as const, label: '$40+', color: 'bg-sky-500/20 text-sky-300 border-sky-400/30' }
  ]

  // All price options - Light blue theme with variations
  const allPriceOptions = [
    { value: 'free' as const, label: 'FREE', color: 'bg-sky-500/20 text-sky-300 border-sky-400/30' },
    { value: '15-below' as const, label: '$15<', color: 'bg-sky-500/20 text-sky-300 border-sky-400/30' },
    { value: '20' as const, label: '$20', color: 'bg-sky-500/20 text-sky-300 border-sky-400/30' },
    { value: '25' as const, label: '$25', color: 'bg-sky-500/20 text-sky-300 border-sky-400/30' },
    { value: '30' as const, label: '$30+', color: 'bg-sky-500/20 text-sky-300 border-sky-400/30' },
    { value: '40-plus' as const, label: '$40+', color: 'bg-sky-500/20 text-sky-300 border-sky-400/30' }
  ]

  // Recent years
  const recentYears = [2025, 2024, 2023]

  return (
    <div className={cn("space-y-3", className)}>
      {/* Modern Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-500/20 rounded-lg">
              <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-white">Filters</span>
            {hasActiveFilters ? (
              <Badge variant="secondary" className="h-5 px-2 text-xs bg-sky-500/20 text-sky-300 border-sky-400/30">
                {activeFilterCount}
              </Badge>
            ) : null}
          </div>
          
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 px-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          ) : null}
        </div>
      </div>

      {/* Horizontal Filter Chips */}
      <div className="flex flex-wrap gap-2">
        
        {/* Price Range Chips - Single Selection */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium">Price:</span>
          {quickPriceOptions.map(option => (
            <button
              key={option.value}
              onClick={() => {
                // Single selection: if already selected, deselect; otherwise, select only this one
                const newFilters = {
                  ...filters,
                  selectedPriceRanges: filters.selectedPriceRanges.includes(option.value)
                    ? [] // Deselect if already selected
                    : [option.value] // Select only this one
                }
                onFiltersChange(newFilters)
              }}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105",
                filters.selectedPriceRanges.includes(option.value)
                  ? `${option.color} shadow-lg`
                  : "bg-zinc-800/50 text-zinc-300 border-zinc-600/50 hover:bg-zinc-700/50 hover:border-zinc-500/50"
              )}
            >
              <DollarSign className="w-3 h-3" />
              {option.label}
            </button>
          ))}
          
          {/* More Prices Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-500/10"
              >
                <Plus className="w-3 h-3 mr-1" />
                More
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 bg-zinc-900 border-zinc-700" align="start">
              <div className="space-y-2">
                <div className="text-xs font-medium text-white mb-2">All Price Options</div>
                {allPriceOptions.map(option => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-zinc-800/50 transition-colors"
                  >
                    <Checkbox
                      checked={filters.selectedPriceRanges.includes(option.value)}
                      onCheckedChange={(checked) => {
                        // Single selection: if checking, select only this one; if unchecking, deselect
                        const newFilters = {
                          ...filters,
                          selectedPriceRanges: checked
                            ? [option.value] // Select only this one
                            : [] // Deselect all
                        }
                        onFiltersChange(newFilters)
                      }}
                      className="h-3 w-3"
                    />
                    <span className="text-sm text-white">{option.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Year Chips - Single Selection */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-medium">Year:</span>
          {recentYears.map(year => (
            <button
              key={year}
              onClick={() => {
                // Single selection: if already selected, deselect; otherwise, select only this one
                const newFilters = {
                  ...filters,
                  selectedYears: filters.selectedYears.includes(year)
                    ? [] // Deselect if already selected
                    : [year] // Select only this one
                }
                onFiltersChange(newFilters)
              }}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105",
                filters.selectedYears.includes(year)
                  ? "bg-sky-500/20 text-sky-300 border-sky-400/30 shadow-lg"
                  : "bg-zinc-800/50 text-zinc-300 border-zinc-600/50 hover:bg-zinc-700/50 hover:border-zinc-500/50"
              )}
            >
              <Calendar className="w-3 h-3" />
              {year}
            </button>
          ))}
          
          {/* More Years Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-500/10"
              >
                <Plus className="w-3 h-3 mr-1" />
                More
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3 bg-zinc-900 border-zinc-700" align="start">
              <div className="space-y-2">
                <div className="text-xs font-medium text-white mb-2">All Years</div>
                {[2025, 2024, 2023, 2022, 2021, 2020].map(year => (
                  <label
                    key={year}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-zinc-800/50 transition-colors"
                  >
                    <Checkbox
                      checked={filters.selectedYears.includes(year)}
                      onCheckedChange={(checked) => {
                        // Single selection: if checking, select only this one; if unchecking, deselect
                        const newFilters = {
                          ...filters,
                          selectedYears: checked
                            ? [year] // Select only this one
                            : [] // Deselect all
                        }
                        onFiltersChange(newFilters)
                      }}
                      className="h-3 w-3"
                    />
                    <span className="text-sm text-white">{year}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filter Summary */}
      {hasActiveFilters ? (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-700/40">
          <span className="text-xs text-zinc-400 font-medium">Active:</span>
          {filters.selectedPriceRanges.map(range => (
            <Badge
              key={range}
              variant="secondary"
              className="h-5 px-2 text-xs bg-sky-500/20 text-sky-300 border-sky-400/30"
            >
              <DollarSign className="w-3 h-3 mr-1" />
              {range === 'free' ? 'FREE' : 
               range === '15-below' ? '$15<' : 
               range === '20' ? '$20' :
               range === '25' ? '$25' :
               range === '30' ? '$30+' :
               range === '40-plus' ? '$40+' : `$${range}`}
              <button
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    selectedPriceRanges: filters.selectedPriceRanges.filter(r => r !== range)
                  }
                  onFiltersChange(newFilters)
                }}
                className="ml-1 hover:text-sky-200"
                aria-label={`Remove ${range === 'free' ? 'FREE' : 
                 range === '15-below' ? '$15<' : 
                 range === '20' ? '$20' :
                 range === '25' ? '$25' :
                 range === '30' ? '$30+' :
                 range === '40-plus' ? '$40+' : `$${range}`} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {filters.selectedYears.map(year => (
            <Badge
              key={year}
              variant="secondary"
              className="h-5 px-2 text-xs bg-sky-500/20 text-sky-300 border-sky-400/30"
            >
              <Calendar className="w-3 h-3 mr-1" />
              {year}
              <button
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    selectedYears: filters.selectedYears.filter(y => y !== year)
                  }
                  onFiltersChange(newFilters)
                }}
                className="ml-1 hover:text-sky-200"
                aria-label={`Remove ${year} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}