'use client'

import { useState } from 'react'
import { m, AnimatePresence } from '@/lib/motion'
import { X, ChevronDown, DollarSign, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export type PriceRangeOption = 'free' | '15-below' | '20' | '25' | '30' | '35' | '40' | '50'

export interface FilterOptions {
  selectedPriceRanges: PriceRangeOption[]
  creators: string[]
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year'
  selectedYears: number[]
}

interface FilterSidebarProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: FilterOptions) => void
  availableCreators?: string[]
  className?: string
}

export function FilterSidebar({
  isOpen,
  onClose,
  onApply,
  availableCreators = [],
  className
}: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    selectedPriceRanges: [],
    creators: [],
    dateRange: 'all',
    selectedYears: []
  })

  const [expandedSections, setExpandedSections] = useState({
    price: true,
    creators: true,
    year: true
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
      dateRange: 'all' as const,
      selectedYears: []
    }
    setFilters(resetFilters)
    onApply(resetFilters)
  }


  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <m.div
          key="filter-sidebar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] pointer-events-none"
        >
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
          />

          {/* Sidebar */}
          <m.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={cn(
              "fixed left-0 top-0 h-full w-80 bg-card border-r border-border shadow-2xl pointer-events-auto",
              className
            )}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 text-primary text-xl">♠</span>
                  <h2 className="text-lg font-bold">Filters</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="lg:hidden"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Filters Content */}
              <ScrollArea className="flex-1 px-4 py-4">
                <div className="space-y-6">
                  {/* Price Range */}
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection('price')}
                      className="flex items-center justify-between w-full text-left p-2 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <Label className="text-base font-semibold text-primary">Price Range</Label>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-primary transition-transform",
                          expandedSections.price && "rotate-180"
                        )}
                      />
                    </button>
                    {expandedSections.price && (
                      <div className="space-y-2 pl-6">
                        {[
                          { value: 'free', label: 'FREE VIDEOS' },
                          { value: '15-below', label: '$15< (includes videos $15 or less, excluding free)' },
                          { value: '20', label: '$20' },
                          { value: '25', label: '$25 (includes $25 through $29.99)' },
                          { value: '30', label: '$30' },
                          { value: '35', label: '$35' },
                          { value: '40', label: '$40' },
                          { value: '50', label: '$50' }
                        ].map(option => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
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
                                onApply(newFilters)
                              }}
                              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>


                  {/* Year Filter */}
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection('year')}
                      className="flex items-center justify-between w-full text-left p-2 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 text-primary">📅</span>
                        <Label className="text-base font-semibold text-primary">Year</Label>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-primary transition-transform",
                          expandedSections.year && "rotate-180"
                        )}
                      />
                    </button>
                    {expandedSections.year && (
                      <div className="space-y-2 pl-6">
                        {[2025, 2024, 2023, 2022, 2021, 2020].map(year => (
                          <label
                            key={year}
                            className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                          >
                            <Checkbox
                              checked={filters.selectedYears.includes(year)}
                              onCheckedChange={() => {
                                const newFilters = {
                                  ...filters,
                                  selectedYears: filters.selectedYears.includes(year)
                                    ? filters.selectedYears.filter(y => y !== year)
                                    : [...filters.selectedYears, year]
                                }
                                onApply(newFilters)
                              }}
                              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <span className="text-sm">{year}</span>
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
                        className="flex items-center justify-between w-full text-left p-2 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          <Label className="text-base font-semibold text-primary">Creators</Label>
                        </div>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-primary transition-transform",
                            expandedSections.creators && "rotate-180"
                          )}
                        />
                      </button>
                      {expandedSections.creators && (
                        <div className="space-y-2 pl-6 max-h-48 overflow-y-auto">
                          {availableCreators.map(creator => (
                            <label
                              key={creator}
                              className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                            >
                              <Checkbox
                                checked={filters.creators.includes(creator)}
                                onCheckedChange={() => {
                                  const newFilters = {
                                    ...filters,
                                    creators: filters.creators.includes(creator)
                                      ? filters.creators.filter(c => c !== creator)
                                      : [...filters.creators, creator]
                                  }
                                  onApply(newFilters)
                                }}
                                className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <span className="text-sm">{creator}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Footer Actions */}
              <div className="p-4 border-t border-border">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  size="lg"
                >
                  Reset All
                </Button>
              </div>
            </div>
          </m.aside>
        </m.div>
      )}
    </AnimatePresence>
  )
}