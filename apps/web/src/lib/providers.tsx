'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { MotionProvider } from '@/lib/motion'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10 * 60 * 1000, // 10 minutes (increased default)
        gcTime: 30 * 60 * 1000, // 30 minutes (increased default)
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Disable refetch on mount if data exists
        refetchOnReconnect: 'always', // Only refetch on reconnect
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error instanceof Error && 'status' in error) {
            const status = (error as { status: number }).status
            if (status >= 400 && status < 500) return false
          }
          return failureCount < 2 // Reduced retries
        },
        retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000), // Faster retry
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <MotionProvider>
          {children}
          <Toaster 
            position="top-center"
            richColors
            closeButton
            duration={4000}
          />
        </MotionProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}