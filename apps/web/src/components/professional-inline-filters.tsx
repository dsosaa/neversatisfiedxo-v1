'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, X, DollarSign, User, Search, Filter, RotateCcw, Sparkles, Calendar } from 'lucide-react'
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

interface ProfessionalInlineFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  availableCreators?: string[]
  className?: string
}

export function ProfessionalInlineFilters({
  filters,
  onFiltersChange,
  availableCreators = [],
  className
}: ProfessionalInlineFiltersProps) {
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
    { value: 'free' as const, label: 'FREE', description: 'No cost', tier: 'basic' },
    { value: '15-below' as const, label: '$15<', description: 'Budget', tier: 'budget' },
    { value: '20' as const, label: '$20', description: 'Standard', tier: 'standard' },
    { value: '25' as const, label: '$25', description: 'Premium', tier: 'premium' },
    { value: '30' as const, label: '$30', description: 'Premium+', tier: 'premium' },
    { value: '35' as const, label: '$35', description: 'Elite', tier: 'elite' },
    { value: '40' as const, label: '$40', description: 'Elite+', tier: 'elite' },
    { value: '50' as const, label: '$50', description: 'Ultimate', tier: 'ultimate' }
  ]

  // Get tier colors
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'budget': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'standard': return 'text-sky-400 bg-sky-400/10 border-sky-400/20'
      case 'premium': return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
      case 'elite': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      case 'ultimate': return 'text-red-400 bg-red-400/10 border-red-400/20'
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Professional Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-sky-500/20 to-blue-600/20 rounded-xl border border-sky-400/30">
              <Filter className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Smart Filters</h3>
              <p className="text-sm text-zinc-400">Refine your content discovery</p>
            </div>
          </div>
          
          {hasActiveFilters && (
            <Badge variant="secondary" className="bg-sky-500/20 text-sky-300 border-sky-400/30 px-3 py-1">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedSections(prev => ({
              price: !prev.price,
              creators: !prev.creators,
              year: !prev.year
            }))}
            className="border-sky-400/30 text-sky-300 hover:bg-sky-500/10 hover:border-sky-400/50 transition-all duration-200"
          >
            {Object.values(expandedSections).some(Boolean) ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Expand All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Filter Options with Professional Spacing */}
      {(expandedSections.price || expandedSections.creators || expandedSections.year) && (
        <div className="bg-gradient-to-br from-zinc-900/40 via-zinc-800/30 to-zinc-900/40 border border-zinc-700/40 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          
          {/* Price Range Section */}
          <div className="mb-8 last:mb-0">
            <button
              onClick={() => toggleSection('price')}
              className="flex items-center gap-4 w-full text-left p-4 rounded-xl hover:bg-zinc-800/30 transition-all duration-200 group"
            >
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl group-hover:from-green-500/30 group-hover:to-emerald-600/30 transition-all duration-200">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-white mb-1">Price Range</h4>
                <p className="text-sm text-zinc-400">Filter by content pricing tiers</p>
              </div>
              <div className="flex items-center gap-2">
                {filters.selectedPriceRanges.length > 0 && (
                  <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                    {filters.selectedPriceRanges.length}
                  </Badge>
                )}
                {expandedSections.price ? (
                  <ChevronUp className="w-5 h-5 text-zinc-400 transition-transform" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-400 transition-transform" />
                )}
              </div>
            </button>
            
            {expandedSections.price && (
              <div className="mt-6 ml-16">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {priceRanges.map(option => (
                    <label
                      key={option.value}
                      className={cn(
                        "group relative flex items-center gap-4 cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02]",
                        filters.selectedPriceRanges.includes(option.value)
                          ? "border-sky-400/50 bg-sky-500/10 shadow-lg shadow-sky-500/20"
                          : "border-zinc-700/50 bg-zinc-800/20 hover:border-zinc-600/50 hover:bg-zinc-700/30"
                      )}
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
                        className="border-2 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">{option.label}</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full border", getTierColor(option.tier))}>
                            {option.tier}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Creators Section */}
          {availableCreators.length > 0 && (
            <div className="mb-8 last:mb-0 border-t border-zinc-700/40 pt-8">
              <button
                onClick={() => toggleSection('creators')}
                className="flex items-center gap-4 w-full text-left p-4 rounded-xl hover:bg-zinc-800/30 transition-all duration-200 group"
              >
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-xl group-hover:from-purple-500/30 group-hover:to-pink-600/30 transition-all duration-200">
                  <User className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-white mb-1">Creators</h4>
                  <p className="text-sm text-zinc-400">Filter by content creators</p>
                </div>
                <div className="flex items-center gap-2">
                  {filters.creators.length > 0 && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                      {filters.creators.length}
                    </Badge>
                  )}
                  {expandedSections.creators ? (
                    <ChevronUp className="w-5 h-5 text-zinc-400 transition-transform" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-400 transition-transform" />
                  )}
                </div>
              </button>
              
              {expandedSections.creators && (
                <div className="mt-6 ml-16 space-y-6">
                  {/* Enhanced Creator Search */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                    <Input
                      placeholder="Search creators..."
                      value={creatorSearch}
                      onChange={(e) => setCreatorSearch(e.target.value)}
                      className="pl-12 h-12 bg-zinc-800/50 border-zinc-600/50 text-white placeholder:text-zinc-400 focus:border-purple-400/50 focus:ring-purple-400/20 rounded-xl"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                    {filteredCreators.map(creator => (
                      <label
                        key={creator}
                        className={cn(
                          "group flex items-center gap-4 cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.01]",
                          filters.creators.includes(creator)
                            ? "border-purple-400/50 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                            : "border-zinc-700/50 bg-zinc-800/20 hover:border-zinc-600/50 hover:bg-zinc-700/30"
                        )}
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
                          className="border-2 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white truncate">{creator}</span>
                            <div className="w-2 h-2 bg-purple-400 rounded-full opacity-60"></div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {filteredCreators.length === 0 && creatorSearch && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-zinc-500" />
                      </div>
                      <p className="text-zinc-400">No creators found for &quot;{creatorSearch}&quot;</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCreatorSearch('')}
                        className="mt-2 text-purple-400 hover:text-purple-300"
                      >
                        Clear search
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Year Section */}
          <div className="border-t border-zinc-700/40 pt-8">
            <button
              onClick={() => toggleSection('year')}
              className="flex items-center gap-4 w-full text-left p-4 rounded-xl hover:bg-zinc-800/30 transition-all duration-200 group"
            >
              <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-xl group-hover:from-orange-500/30 group-hover:to-red-600/30 transition-all duration-200">
                <Calendar className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-white mb-1">Release Year</h4>
                <p className="text-sm text-zinc-400">Filter by content release date</p>
              </div>
              <div className="flex items-center gap-2">
                {filters.selectedYears.length > 0 && (
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30">
                    {filters.selectedYears.length}
                  </Badge>
                )}
                {expandedSections.year ? (
                  <ChevronUp className="w-5 h-5 text-zinc-400 transition-transform" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-400 transition-transform" />
                )}
              </div>
            </button>
            
            {expandedSections.year && (
              <div className="mt-6 ml-16">
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
                  {[2025, 2024, 2023, 2022, 2021, 2020].map(year => (
                    <label
                      key={year}
                      className={cn(
                        "group flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02]",
                        filters.selectedYears.includes(year)
                          ? "border-orange-400/50 bg-orange-500/10 shadow-lg shadow-orange-500/20"
                          : "border-zinc-700/50 bg-zinc-800/20 hover:border-zinc-600/50 hover:bg-zinc-700/30"
                      )}
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
                        className="border-2 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <div className="flex-1 text-center">
                        <span className="font-semibold text-white text-lg">{year}</span>
                        <div className="w-1 h-1 bg-orange-400 rounded-full mx-auto mt-1 opacity-60"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Professional Active Filter Display */}
      {hasActiveFilters && (
        <div className="bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 border border-zinc-700/40 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h4 className="text-lg font-semibold text-white">Active Filters</h4>
            <Badge variant="secondary" className="bg-sky-500/20 text-sky-300 border-sky-400/30">
              {activeFilterCount} applied
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {filters.selectedPriceRanges.map(range => (
              <Badge
                key={range}
                variant="secondary"
                className="bg-green-500/20 text-green-300 border-green-400/30 hover:bg-green-500/30 transition-all duration-200 group px-4 py-2"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {range === 'free' ? 'FREE' : range === '15-below' ? '$15<' : `$${range}`}
                <button
                  onClick={() => {
                    const newFilters = {
                      ...filters,
                      selectedPriceRanges: filters.selectedPriceRanges.filter(r => r !== range)
                    }
                    onFiltersChange(newFilters)
                  }}
                  className="ml-2 hover:text-green-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </Badge>
            ))}
            {filters.creators.map(creator => (
              <Badge
                key={creator}
                variant="secondary"
                className="bg-purple-500/20 text-purple-300 border-purple-400/30 hover:bg-purple-500/30 transition-all duration-200 group px-4 py-2"
              >
                <User className="w-4 h-4 mr-2" />
                {creator}
                <button
                  onClick={() => {
                    const newFilters = {
                      ...filters,
                      creators: filters.creators.filter(c => c !== creator)
                    }
                    onFiltersChange(newFilters)
                  }}
                  className="ml-2 hover:text-purple-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </Badge>
            ))}
            {filters.selectedYears.map(year => (
              <Badge
                key={year}
                variant="secondary"
                className="bg-orange-500/20 text-orange-300 border-orange-400/30 hover:bg-orange-500/30 transition-all duration-200 group px-4 py-2"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {year}
                <button
                  onClick={() => {
                    const newFilters = {
                      ...filters,
                      selectedYears: filters.selectedYears.filter(y => y !== year)
                    }
                    onFiltersChange(newFilters)
                  }}
                  className="ml-2 hover:text-orange-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
