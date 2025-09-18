'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, X, DollarSign, User, Search, Filter, RotateCcw } from 'lucide-react'
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

interface EnhancedInlineFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  availableCreators?: string[]
  className?: string
}

export function EnhancedInlineFilters({
  filters,
  onFiltersChange,
  availableCreators = [],
  className
}: EnhancedInlineFiltersProps) {
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

  // Price range options with better organization
  const priceRanges = [
    { value: 'free' as const, label: 'FREE', description: 'No cost' },
    { value: '15-below' as const, label: '$15<', description: 'Under $15' },
    { value: '20' as const, label: '$20', description: 'Standard' },
    { value: '25' as const, label: '$25', description: 'Premium' },
    { value: '30' as const, label: '$30', description: 'Premium+' },
    { value: '35' as const, label: '$35', description: 'Elite' },
    { value: '40' as const, label: '$40', description: 'Elite+' },
    { value: '50' as const, label: '$50', description: 'Ultimate' }
  ]

  return (
    <div className={cn("space-y-4", className)}>
      {/* Enhanced Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedSections(prev => ({
              price: !prev.price,
              creators: !prev.creators,
              year: !prev.year
            }))}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
          >
            <Filter className="w-4 h-4 mr-2" />
            Smart Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground text-xs">
                {activeFilterCount}
              </Badge>
            )}
            {Object.values(expandedSections).some(Boolean) ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-primary hover:text-primary-foreground hover:bg-primary transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset All
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        {hasActiveFilters && (
          <div className="text-sm text-zinc-400">
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
          </div>
        )}
      </div>

      {/* Enhanced Filter Options */}
      {(expandedSections.price || expandedSections.creators || expandedSections.year) && (
        <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 border border-zinc-700/60 rounded-xl p-6 space-y-6 backdrop-blur-sm">
          
          {/* Enhanced Price Range */}
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('price')}
              className="flex items-center gap-3 text-primary hover:text-primary-foreground hover:bg-primary/10 p-3 rounded-lg transition-all duration-200 group"
            >
              <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <span className="font-semibold text-lg">Price Range</span>
                <p className="text-sm text-zinc-400">Filter by video pricing</p>
              </div>
              {expandedSections.price ? (
                <ChevronUp className="w-5 h-5 transition-transform" />
              ) : (
                <ChevronDown className="w-5 h-5 transition-transform" />
              )}
            </button>
            
            {expandedSections.price && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pl-16">
                {priceRanges.map(option => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 cursor-pointer hover:text-primary transition-all duration-200 p-3 rounded-lg hover:bg-primary/5 border border-transparent hover:border-primary/20"
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
                      className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{option.label}</div>
                      <div className="text-xs text-zinc-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Creators */}
          {availableCreators.length > 0 && (
            <div className="space-y-4">
              <button
                onClick={() => toggleSection('creators')}
                className="flex items-center gap-3 text-primary hover:text-primary-foreground hover:bg-primary/10 p-3 rounded-lg transition-all duration-200 group"
              >
                <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold text-lg">Creators</span>
                  <p className="text-sm text-zinc-400">Filter by content creators</p>
                </div>
                {expandedSections.creators ? (
                  <ChevronUp className="w-5 h-5 transition-transform" />
                ) : (
                  <ChevronDown className="w-5 h-5 transition-transform" />
                )}
              </button>
              
              {expandedSections.creators && (
                <div className="space-y-4 pl-16">
                  {/* Creator Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
                    <Input
                      placeholder="Search creators..."
                      value={creatorSearch}
                      onChange={(e) => setCreatorSearch(e.target.value)}
                      className="pl-10 bg-zinc-800/50 border-zinc-600/50 text-white placeholder:text-zinc-400 focus:border-primary"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {filteredCreators.map(creator => (
                      <label
                        key={creator}
                        className="flex items-center gap-3 cursor-pointer hover:text-primary transition-all duration-200 p-2 rounded-lg hover:bg-primary/5 border border-transparent hover:border-primary/20"
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
                          className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span className="text-sm font-medium truncate">{creator}</span>
                      </label>
                    ))}
                  </div>
                  
                  {filteredCreators.length === 0 && creatorSearch && (
                    <div className="text-center py-4 text-zinc-400">
                      No creators found for &quot;{creatorSearch}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Enhanced Year */}
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('year')}
              className="flex items-center gap-3 text-primary hover:text-primary-foreground hover:bg-primary/10 p-3 rounded-lg transition-all duration-200 group"
            >
              <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                <span className="text-lg">📅</span>
              </div>
              <div className="flex-1 text-left">
                <span className="font-semibold text-lg">Release Year</span>
                <p className="text-sm text-zinc-400">Filter by video release date</p>
              </div>
              {expandedSections.year ? (
                <ChevronUp className="w-5 h-5 transition-transform" />
              ) : (
                <ChevronDown className="w-5 h-5 transition-transform" />
              )}
            </button>
            
            {expandedSections.year && (
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 pl-16">
                {[2025, 2024, 2023, 2022, 2021, 2020].map(year => (
                  <label
                    key={year}
                    className="flex items-center gap-3 cursor-pointer hover:text-primary transition-all duration-200 p-3 rounded-lg hover:bg-primary/5 border border-transparent hover:border-primary/20"
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
                      className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-sm font-medium">{year}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Active Filter Pills */}
      {hasActiveFilters && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-zinc-300">Active Filters:</div>
          <div className="flex flex-wrap gap-2">
            {filters.selectedPriceRanges.map(range => (
              <Badge
                key={range}
                variant="secondary"
                className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 transition-colors group"
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
                  className="ml-2 hover:text-primary-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {filters.creators.map(creator => (
              <Badge
                key={creator}
                variant="secondary"
                className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 transition-colors group"
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
                  className="ml-2 hover:text-primary-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {filters.selectedYears.map(year => (
              <Badge
                key={year}
                variant="secondary"
                className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 transition-colors group"
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
                  className="ml-2 hover:text-primary-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
