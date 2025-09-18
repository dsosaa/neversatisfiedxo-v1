'use client'

import { useState } from 'react'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { m } from '@/lib/motion'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { SpadePasswordInput } from '@/components/ui/spade-password-input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function EnterPage() {
  const router = useRouter()
  
  // Set page title
  React.useEffect(() => {
    document.title = 'enter...'
  }, [])
  
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      toast.error('Please enter the access code')
      return
    }

    setIsLoading(true)

    try {
      // Simple direct authentication
      const response = await fetch('/api/auth/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        // Authentication successful, redirecting immediately
        router.replace('/gallery')
      } else {
        toast.error('Invalid access code')
        setPassword('')
      }
    } catch (error) {
      console.error('Authentication error:', error)
      toast.error('Connection failed, please try again')
      setPassword('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-background">
      {/* Background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base gradient background */}
        <div className="absolute inset-0 bg-gradient-radial from-zinc-900/0 via-zinc-900/40 to-zinc-950" />
        
        {/* Animated background elements */}
        <m.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-sky-400/5 to-transparent rounded-full"
        />
        <m.div
          animate={{ 
            rotate: [360, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{ 
            duration: 15,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-fuchsia-500/3 to-transparent rounded-full"
        />
      </div>

      {/* Main content card */}
      <m.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo section */}
        <div className="text-center mb-12">
          <m.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            className="mb-6"
          >
            <div className="relative drop-shadow-2xl">
              <Image
                src="/neversatisfiedxo-logo.png"
                alt="neversatisfiedxo"
                width={800}
                height={200}
                priority
                quality={95}
                className="w-72 sm:w-80 md:w-96 h-auto mx-auto object-contain max-w-full"
                style={{
                  imageRendering: 'crisp-edges',
                } as React.CSSProperties}
                sizes="(max-width: 640px) 288px, (max-width: 768px) 320px, 384px"
              />
            </div>
            
            {/* Brand accent line */}
            <div className="h-1 w-24 mx-auto mt-6 rounded-full bg-gradient-to-r from-sky-400 to-fuchsia-300 shadow-lg shadow-sky-400/25" />
          </m.div>
        </div>

        {/* Form */}
        <m.form
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Input field */}
          <div className="space-y-3">
            <Label 
              htmlFor="access-code" 
              className="text-sm font-semibold tracking-wide flex items-center gap-2 text-zinc-300"
            >
              Access code
            </Label>
            <SpadePasswordInput
              id="access-code"
              placeholder="••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              disabled={isLoading}
              className="h-12 text-center text-lg rounded-xl transition-all duration-200 border-zinc-700 bg-zinc-900/50 backdrop-blur-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 shadow-lg shadow-black/10 placeholder:text-zinc-600"
              autoFocus
              autoComplete="one-time-code"
              aria-describedby="access-code-help"
              showToggle={password.length > 0}
            />
            <p id="access-code-help" className="sr-only">
              Enter your access code to unlock the private gallery
            </p>
          </div>

          {/* CTA Button */}
          <div className="space-y-4">
            <Button
              type="submit"
              disabled={isLoading || !password.trim()}
              className={cn(
                "w-full h-14 text-lg font-bold rounded-2xl transition-all duration-200 shadow-lg focus:ring-2 focus:ring-sky-400/50 focus:ring-offset-2 focus:ring-offset-zinc-950",
                'bg-sky-400 hover:bg-sky-500 text-zinc-900 hover:shadow-xl hover:shadow-sky-400/25 hover:scale-[1.02] active:scale-[0.98]',
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              )}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </div>
              ) : (
                'i submit'
              )}
            </Button>
            
            {/* Help link */}
            <div className="text-center">
              <a
                href="http://www.neversatisfiedxo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm transition-colors underline-offset-4 hover:underline text-zinc-500 hover:text-zinc-400"
              >
                Need a code?
              </a>
            </div>
          </div>
        </m.form>

      </m.div>
    </div>
  )
}