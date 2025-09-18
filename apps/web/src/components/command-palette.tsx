'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { m, AnimatePresence } from '@/lib/motion'
import { Search, Play, User, DollarSign, Clock, Zap, Filter, Home } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useFocusTrap } from '@/hooks/use-focus-trap'

interface CommandPaletteProps {
  trailers?: Array<{
    id: string
    title: string
    creators: string
    price: string
    length: string
    cf_video_uid: string
  }>
  onTrailerSelect?: (trailer: NonNullable<CommandPaletteProps['trailers']>[0]) => void
}

interface Command {
  id: string
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  shortcut?: string[]
  group: string
}

/**
 * Premium command palette with global search and keyboard shortcuts
 * Provides quick access to trailers, navigation, and actions
 */
export function CommandPalette({ trailers = [], onTrailerSelect }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const focusTrapRef = useFocusTrap<HTMLDivElement>(open)

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      
      // Escape to close
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Filter trailers based on search
  const filteredTrailers = useMemo(() => {
    if (!search) return trailers.slice(0, 6) // Show top 6 when no search
    
    return trailers.filter(trailer =>
      trailer.title.toLowerCase().includes(search.toLowerCase()) ||
      trailer.creators.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 8) // Show top 8 matches
  }, [trailers, search])

  // Static commands
  const staticCommands: Command[] = [
    {
      id: 'home',
      title: 'Go to Home',
      description: 'Navigate to the main gallery',
      icon: Home,
      action: () => {
        router.push('/')
        setOpen(false)
      },
      shortcut: ['g', 'h'],
      group: 'Navigation'
    },
    {
      id: 'search',
      title: 'Search Trailers',
      description: 'Open advanced search',
      icon: Search,
      action: () => {
        // In a real app, this might open a search modal
        router.push('/?search=true')
        setOpen(false)
      },
      shortcut: ['/', ''],
      group: 'Actions'
    },
    {
      id: 'filter-free',
      title: 'Show Free Content',
      description: 'Filter to show only free trailers',
      icon: Filter,
      action: () => {
        router.push('/?filter=free')
        setOpen(false)
      },
      group: 'Filters'
    },
    {
      id: 'filter-premium',
      title: 'Show Premium Content',
      description: 'Filter to show only premium trailers',
      icon: DollarSign,
      action: () => {
        router.push('/?filter=premium')
        setOpen(false)
      },
      group: 'Filters'
    }
  ]

  const handleTrailerSelect = (trailer: NonNullable<CommandPaletteProps['trailers']>[0]) => {
    onTrailerSelect?.(trailer)
    setOpen(false)
  }


  return (
    <>
      {/* Trigger hint for keyboard users */}
      <div className="fixed bottom-4 right-4 z-40 opacity-0 group-focus-within:opacity-100 transition-opacity">
        <div className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            ⌘K
          </kbd>
          <span className="ml-2">Search</span>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div ref={focusTrapRef} className="relative">
          <m.div
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.98 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.98 }}
            transition={prefersReducedMotion ? { duration: 0 } : {
              duration: 0.2,
              ease: 'easeOut'
            }}
          >
            <CommandInput 
              placeholder="Search trailers, creators, or commands..." 
              value={search}
              onValueChange={setSearch}
              className="h-12 text-base"
            />
            
            <CommandList className="max-h-[400px]">
              <CommandEmpty>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No results found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try searching for trailers, creators, or commands
                  </p>
                </div>
              </CommandEmpty>

              {/* Trailer Results */}
              {filteredTrailers.length > 0 && (
                <CommandGroup heading="Trailers">
                  <AnimatePresence mode="popLayout">
                    {filteredTrailers.map((trailer, index) => (
                      <m.div
                        key={trailer.id}
                        initial={prefersReducedMotion ? {} : { opacity: 0, y: 4 }}
                        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                        exit={prefersReducedMotion ? {} : { opacity: 0, y: -4 }}
                        transition={prefersReducedMotion ? { duration: 0 } : {
                          duration: 0.15,
                          delay: index * 0.02,
                          ease: 'easeOut'
                        }}
                      >
                        <CommandItem
                          onSelect={() => handleTrailerSelect(trailer)}
                          className="flex items-center gap-3 p-3 cursor-pointer group"
                        >
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center group-hover:bg-muted/70 transition-colors">
                            <Play className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium truncate">{trailer.title}</span>
                              <Badge 
                                variant={trailer.price === 'FREE' ? 'secondary' : 'default'}
                                className="text-xs shrink-0"
                              >
                                {trailer.price}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span className="truncate">{trailer.creators}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{trailer.length}</span>
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      </m.div>
                    ))}
                  </AnimatePresence>
                </CommandGroup>
              )}

              {/* Static Commands */}
              <CommandGroup heading="Commands">
                {staticCommands.map((command) => {
                  const Icon = command.icon
                  return (
                    <CommandItem
                      key={command.id}
                      onSelect={command.action}
                      className="flex items-center gap-3 p-3 cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{command.title}</div>
                        {command.description && (
                          <div className="text-xs text-muted-foreground">
                            {command.description}
                          </div>
                        )}
                      </div>
                      {command.shortcut && (
                        <CommandShortcut className="gap-1">
                          {command.shortcut.map((key, i) => (
                            <kbd 
                              key={i}
                              className="bg-muted text-muted-foreground"
                            >
                              {key}
                            </kbd>
                          ))}
                        </CommandShortcut>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>

              {/* Quick Actions */}
              {!search && (
                <CommandGroup heading="Quick Actions">
                  <CommandItem
                    onSelect={() => {
                      router.push('/?sort=recent')
                      setOpen(false)
                    }}
                    className="flex items-center gap-3 p-3"
                  >
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <span>Recently Added</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => {
                      router.push('/?sort=featured')
                      setOpen(false)
                    }}
                    className="flex items-center gap-3 p-3"
                  >
                    <Play className="w-4 h-4 text-muted-foreground" />
                    <span>Featured Content</span>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>

            {/* Footer with shortcuts */}
            <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground flex justify-between items-center bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="h-5 w-5 bg-muted border rounded text-center leading-5">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="h-5 w-5 bg-muted border rounded text-center leading-5">⌘</kbd>
                  <kbd className="h-5 w-5 bg-muted border rounded text-center leading-5">K</kbd>
                  <span>Toggle</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="h-5 w-5 bg-muted border rounded text-center leading-5">↑</kbd>
                <kbd className="h-5 w-5 bg-muted border rounded text-center leading-5">↓</kbd>
                <span>Navigate</span>
              </div>
            </div>
          </m.div>
        </div>
      </CommandDialog>
    </>
  )
}