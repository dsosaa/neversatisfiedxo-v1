'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, X, DollarSign, User, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export type PriceRangeOption = 'free' | '15-below' | '20' | '25' | '30' | '35' | '40' | '50'

export interface FilterOptions {
  selectedPriceRanges: PriceRangeOption[]
  creators: string[]
  selectedYears: number[]
}

interface InlineFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  availableCreators?: string[]
  className?: string
}

export function InlineFilters({
  filters,
  onFiltersChange,
  availableCreators = [],
  className
}: InlineFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    price: false,
    creators: false,
    year: false
  })

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
  }

  // Count active filters
  const activeFilterCount = 
    filters.selectedPriceRanges.length + 
    filters.creators.length + 
    filters.selectedYears.length

  const hasActiveFilters = activeFilterCount > 0

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Toggle Header */}
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
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground">
                {activeFilterCount}
              </Badge>
            )}
            {expandedSections.price || expandedSections.creators || expandedSections.year ? (
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
              className="text-primary hover:text-primary-foreground hover:bg-primary"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Expandable Filter Options */}
      {(expandedSections.price || expandedSections.creators || expandedSections.year) && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-6">
          {/* Price Range */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('price')}
              className="flex items-center gap-2 text-primary hover:text-primary-foreground hover:bg-primary/10 p-2 rounded-lg transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold">Price Range</span>
              {expandedSections.price ? (
                <ChevronUp className="w-4 h-4 ml-auto" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-auto" />
              )}
            </button>
            
            {expandedSections.price && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pl-6">
                {[
                  { value: 'free', label: 'FREE' },
                  { value: '15-below', label: '$15<' },
                  { value: '20', label: '$20' },
                  { value: '25', label: '$25' },
                  { value: '30', label: '$30' },
                  { value: '35', label: '$35' },
                  { value: '40', label: '$40' },
                  { value: '50', label: '$50' }
                ].map(option => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/5"
                  >
                    <Checkbox
                      checked={filters.selectedPriceRanges.includes(option.value as PriceRangeOption)}
                      onCheckedChange={(checked) => {
                        const newFilters = {
                          ...filters,
                          selectedPriceRanges: checked
                            ? [...filters.selectedPriceRanges, option.value as PriceRangeOption]
                            : filters.selectedPriceRanges.filter(range => range !== option.value)
                        }
                        onFiltersChange(newFilters)
                      }}
                      className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Creators */}
          {availableCreators.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => toggleSection('creators')}
                className="flex items-center gap-2 text-primary hover:text-primary-foreground hover:bg-primary/10 p-2 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="font-semibold">Creators</span>
                {expandedSections.creators ? (
                  <ChevronUp className="w-4 h-4 ml-auto" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-auto" />
                )}
              </button>
              
              {expandedSections.creators && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6 max-h-40 overflow-y-auto">
                  {availableCreators.map(creator => (
                    <label
                      key={creator}
                      className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/5"
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
              )}
            </div>
          )}

          {/* Year */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('year')}
              className="flex items-center gap-2 text-primary hover:text-primary-foreground hover:bg-primary/10 p-2 rounded-lg transition-colors"
            >
              <span className="font-semibold">📅</span>
              <span className="font-semibold">Year</span>
              {expandedSections.year ? (
                <ChevronUp className="w-4 h-4 ml-auto" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-auto" />
              )}
            </button>
            
            {expandedSections.year && (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 pl-6">
                {[2025, 2024, 2023, 2022, 2021, 2020].map(year => (
                  <label
                    key={year}
                    className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/5"
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

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.selectedPriceRanges.map(range => (
            <Badge
              key={range}
              variant="secondary"
              className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
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
                className="ml-2 hover:text-primary-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {filters.creators.map(creator => (
            <Badge
              key={creator}
              variant="secondary"
              className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
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
                className="ml-2 hover:text-primary-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {filters.selectedYears.map(year => (
            <Badge
              key={year}
              variant="secondary"
              className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
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
                className="ml-2 hover:text-primary-foreground"
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
