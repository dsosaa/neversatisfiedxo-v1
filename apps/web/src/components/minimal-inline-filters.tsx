'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, X, DollarSign, User, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type PriceRangeOption = 'free' | '15-below' | '20' | '25' | '30' | '35' | '40' | '50'

export interface FilterOptions {
  selectedPriceRanges: PriceRangeOption[]
  creators: string[]
  selectedYears: number[]
}

interface MinimalInlineFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  availableCreators?: string[]
  className?: string
}

export function MinimalInlineFilters({
  filters,
  onFiltersChange,
  availableCreators = [],
  className
}: MinimalInlineFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    price: false,
    creators: false,
    year: false
  })

  const [creatorSearch, setCreatorSearch] = useState('')

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleReset = () => {
    const resetFilters = {
      selectedPriceRanges: [],
      creators: [],
      selectedYears: []
    }
    onFiltersChange(resetFilters)
    setCreatorSearch('')
  }

  // Filter creators based on search
  const filteredCreators = useMemo(() => {
    if (!creatorSearch) return availableCreators
    return availableCreators.filter(creator => 
      creator.toLowerCase().includes(creatorSearch.toLowerCase())
    )
  }, [availableCreators, creatorSearch])

  // Count active filters
  const activeFilterCount = 
    filters.selectedPriceRanges.length + 
    filters.creators.length + 
    filters.selectedYears.length

  const hasActiveFilters = activeFilterCount > 0

  const priceRanges = [
    { value: 'free' as const, label: 'FREE' },
    { value: '15-below' as const, label: '$15<' },
    { value: '20' as const, label: '$20' },
    { value: '25' as const, label: '$25' },
    { value: '30' as const, label: '$30' },
    { value: '35' as const, label: '$35' },
    { value: '40' as const, label: '$40' },
    { value: '50' as const, label: '$50' }
  ]

  return (
    <div className={cn("space-y-3", className)}>
      {/* Minimal Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedSections(prev => ({
              price: !prev.price,
              creators: !prev.creators,
              year: !prev.year
            }))}
            className="h-8 px-3 text-xs border-sky-400/30 text-sky-300 hover:bg-sky-500/10"
          >
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs bg-sky-500/20 text-sky-300">
                {activeFilterCount}
              </Badge>
            )}
            {Object.values(expandedSections).some(Boolean) ? (
              <ChevronUp className="w-3 h-3 ml-1" />
            ) : (
              <ChevronDown className="w-3 h-3 ml-1" />
            )}
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2 text-xs text-zinc-400 hover:text-white"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Compact Filter Options */}
      {(expandedSections.price || expandedSections.creators || expandedSections.year) && (
        <div className="bg-zinc-900/30 border border-zinc-700/40 rounded-lg p-4 space-y-4">
          
          {/* Price Range */}
          <div>
            <button
              onClick={() => toggleSection('price')}
              className="flex items-center gap-2 w-full text-left p-2 rounded hover:bg-zinc-800/30 transition-colors"
            >
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-white">Price</span>
              {filters.selectedPriceRanges.length > 0 && (
                <Badge className="h-4 px-1 text-xs bg-green-500/20 text-green-300">
                  {filters.selectedPriceRanges.length}
                </Badge>
              )}
              {expandedSections.price ? (
                <ChevronUp className="w-3 h-3 text-zinc-400 ml-auto" />
              ) : (
                <ChevronDown className="w-3 h-3 text-zinc-400 ml-auto" />
              )}
            </button>
            
            {expandedSections.price && (
              <div className="mt-2 ml-6 grid grid-cols-4 gap-1">
                {priceRanges.map(option => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-zinc-800/20 transition-colors"
                  >
                    <Checkbox
                      checked={filters.selectedPriceRanges.includes(option.value)}
                      onCheckedChange={(checked) => {
                        const newFilters = {
                          ...filters,
                          selectedPriceRanges: checked
                            ? [...filters.selectedPriceRanges, option.value]
                            : filters.selectedPriceRanges.filter(range => range !== option.value)
                        }
                        onFiltersChange(newFilters)
                      }}
                      className="h-3 w-3 border-primary data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                    <span className="text-xs text-white">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Creators */}
          {availableCreators.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('creators')}
                className="flex items-center gap-2 w-full text-left p-2 rounded hover:bg-zinc-800/30 transition-colors"
              >
                <User className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Creators</span>
                {filters.creators.length > 0 && (
                  <Badge className="h-4 px-1 text-xs bg-purple-500/20 text-purple-300">
                    {filters.creators.length}
                  </Badge>
                )}
                {expandedSections.creators ? (
                  <ChevronUp className="w-3 h-3 text-zinc-400 ml-auto" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-zinc-400 ml-auto" />
                )}
              </button>
              
              {expandedSections.creators && (
                <div className="mt-2 ml-6 space-y-2">
                  <Input
                    placeholder="Search creators..."
                    value={creatorSearch}
                    onChange={(e) => setCreatorSearch(e.target.value)}
                    className="h-7 text-xs bg-zinc-800/50 border-zinc-600/50 text-white placeholder:text-zinc-400"
                  />
                  <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                    {filteredCreators.map(creator => (
                      <label
                        key={creator}
                        className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-zinc-800/20 transition-colors"
                      >
                        <Checkbox
                          checked={filters.creators.includes(creator)}
                          onCheckedChange={(checked) => {
                            const newFilters = {
                              ...filters,
                              creators: checked
                                ? [...filters.creators, creator]
                                : filters.creators.filter(c => c !== creator)
                            }
                            onFiltersChange(newFilters)
                          }}
                          className="h-3 w-3 border-primary data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                        />
                        <span className="text-xs text-white truncate">{creator}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Year */}
          <div>
            <button
              onClick={() => toggleSection('year')}
              className="flex items-center gap-2 w-full text-left p-2 rounded hover:bg-zinc-800/30 transition-colors"
            >
              <Calendar className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-white">Year</span>
              {filters.selectedYears.length > 0 && (
                <Badge className="h-4 px-1 text-xs bg-orange-500/20 text-orange-300">
                  {filters.selectedYears.length}
                </Badge>
              )}
              {expandedSections.year ? (
                <ChevronUp className="w-3 h-3 text-zinc-400 ml-auto" />
              ) : (
                <ChevronDown className="w-3 h-3 text-zinc-400 ml-auto" />
              )}
            </button>
            
            {expandedSections.year && (
              <div className="mt-2 ml-6 grid grid-cols-3 gap-1">
                {[2025, 2024, 2023, 2022, 2021, 2020].map(year => (
                  <label
                    key={year}
                    className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-zinc-800/20 transition-colors"
                  >
                    <Checkbox
                      checked={filters.selectedYears.includes(year)}
                      onCheckedChange={(checked) => {
                        const newFilters = {
                          ...filters,
                          selectedYears: checked
                            ? [...filters.selectedYears, year]
                            : filters.selectedYears.filter(y => y !== year)
                        }
                        onFiltersChange(newFilters)
                      }}
                      className="h-3 w-3 border-primary data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    />
                    <span className="text-xs text-white">{year}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compact Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          {filters.selectedPriceRanges.map(range => (
            <Badge
              key={range}
              variant="secondary"
              className="h-5 px-2 text-xs bg-green-500/20 text-green-300 border-green-400/30"
            >
              {range === 'free' ? 'FREE' : range === '15-below' ? '$15<' : `$${range}`}
              <button
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    selectedPriceRanges: filters.selectedPriceRanges.filter(r => r !== range)
                  }
                  onFiltersChange(newFilters)
                }}
                className="ml-1 hover:text-green-200"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {filters.creators.map(creator => (
            <Badge
              key={creator}
              variant="secondary"
              className="h-5 px-2 text-xs bg-purple-500/20 text-purple-300 border-purple-400/30"
            >
              {creator}
              <button
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    creators: filters.creators.filter(c => c !== creator)
                  }
                  onFiltersChange(newFilters)
                }}
                className="ml-1 hover:text-purple-200"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {filters.selectedYears.map(year => (
            <Badge
              key={year}
              variant="secondary"
              className="h-5 px-2 text-xs bg-orange-500/20 text-orange-300 border-orange-400/30"
            >
              {year}
              <button
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    selectedYears: filters.selectedYears.filter(y => y !== year)
                  }
                  onFiltersChange(newFilters)
                }}
                className="ml-1 hover:text-orange-200"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
