'use client'

import { useState } from 'react'
import { m, AnimatePresence } from '@/lib/motion'
import { Filter, X, ChevronDown, DollarSign, Clock, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export type PriceRangeOption = 'free' | '15-below' | '20' | '25' | '30' | '35' | '40' | '50'

export interface FilterOptions {
  selectedPriceRanges: PriceRangeOption[]
  durationRange: [number, number]
  creators: string[]
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year'
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
    durationRange: [0, 60],
    creators: [],
    dateRange: 'all'
  })

  const [expandedSections, setExpandedSections] = useState({
    price: true,
    duration: true,
    creators: true,
    date: true
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleApply = () => {
    onApply(filters)
    onClose()
  }

  const handleReset = () => {
    setFilters({
      selectedPriceRanges: [],
      durationRange: [0, 60],
      creators: [],
      dateRange: 'all'
    })
  }

  const toggleCreator = (creator: string) => {
    setFilters(prev => ({
      ...prev,
      creators: prev.creators.includes(creator)
        ? prev.creators.filter(c => c !== creator)
        : [...prev.creators, creator]
    }))
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
                  <Filter className="w-5 h-5 text-primary" />
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
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-base font-semibold">Price Range</Label>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform",
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
                                setFilters(prev => ({
                                  ...prev,
                                  selectedPriceRanges: checked
                                    ? [...prev.selectedPriceRanges, option.value as PriceRangeOption]
                                    : prev.selectedPriceRanges.filter(range => range !== option.value)
                                }))
                              }}
                            />
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Duration Range */}
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection('duration')}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-base font-semibold">Duration</Label>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform",
                          expandedSections.duration && "rotate-180"
                        )}
                      />
                    </button>
                    {expandedSections.duration && (
                      <div className="space-y-3 pl-6">
                        <div className="flex items-center justify-between text-sm">
                          <span>{filters.durationRange[0]} min</span>
                          <span>{filters.durationRange[1]} min</span>
                        </div>
                        <Slider
                          value={filters.durationRange}
                          onValueChange={(value) => setFilters(prev => ({
                            ...prev,
                            durationRange: value as [number, number]
                          }))}
                          max={60}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>

                  {/* Date Range */}
                  <div className="space-y-3">
                    <button
                      onClick={() => toggleSection('date')}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-base font-semibold">Upload Date</Label>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform",
                          expandedSections.date && "rotate-180"
                        )}
                      />
                    </button>
                    {expandedSections.date && (
                      <div className="space-y-2 pl-6">
                        {[
                          { value: 'all', label: 'All time' },
                          { value: 'today', label: 'Today' },
                          { value: 'week', label: 'This week' },
                          { value: 'month', label: 'This month' },
                          { value: 'year', label: 'This year' }
                        ].map(option => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                          >
                            <input
                              type="radio"
                              name="dateRange"
                              value={option.value}
                              checked={filters.dateRange === option.value}
                              onChange={(e) => setFilters(prev => ({
                                ...prev,
                                dateRange: e.target.value as FilterOptions['dateRange']
                              }))}
                              className="text-primary"
                            />
                            <span className="text-sm">{option.label}</span>
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
                        className="flex items-center justify-between w-full text-left"
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <Label className="text-base font-semibold">Creators</Label>
                        </div>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
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
                                onCheckedChange={() => toggleCreator(creator)}
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
              <div className="p-4 border-t border-border space-y-2">
                <Button
                  onClick={handleApply}
                  className="w-full"
                  size="lg"
                >
                  Apply Filters
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
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