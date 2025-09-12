'use client'

import { useState } from 'react'
import * as React from 'react'
import { m } from '@/lib/motion'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { SpadePasswordInput } from '@/components/ui/spade-password-input'
import { Label } from '@/components/ui/label'
import { useVerifyPassword } from '@/lib/hooks'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function EnterPage() {
  // Set page title
  React.useEffect(() => {
    document.title = 'enter...'
  }, [])
  
  const [password, setPassword] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [cooldownTime, setCooldownTime] = useState(0)
  const verifyPassword = useVerifyPassword()

  // Cooldown timer effect
  React.useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => {
        setCooldownTime(cooldownTime - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldownTime])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (cooldownTime > 0) {
      toast.error(`Please wait ${cooldownTime}s before trying again`)
      return
    }
    
    if (!password.trim()) {
      toast.error('Please enter an access code')
      return
    }

    try {
      const result = await verifyPassword.mutateAsync(password)
      
      if (result.success) {
        setIsSuccess(true)
        toast.success('Access granted! Welcome to the gallery')
        console.log('🎉 Authentication successful, preparing redirect...')
        
        // Force immediate redirect
        console.log('🚀 Forcing immediate redirect...')
        window.location.href = '/gallery'
      } else {
        const newAttemptCount = attemptCount + 1
        setAttemptCount(newAttemptCount)
        
        // Apply cooldown after multiple failed attempts
        if (newAttemptCount >= 3) {
          const cooldown = Math.min(newAttemptCount - 2, 5) * 3 // 3s, 6s, 9s, 12s, 15s max
          setCooldownTime(cooldown)
        }
        
        toast.error('Invalid access code')
        setPassword('')
      }
    } catch {
      toast.error('Connection failed, please try again')
      setPassword('')
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
              {cooldownTime > 0 && (
                <span className="text-xs px-2 py-1 rounded-full text-amber-400 bg-amber-400/10">
                  Wait {cooldownTime}s
                </span>
              )}
            </Label>
            <SpadePasswordInput
              id="access-code"
              placeholder="••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              disabled={verifyPassword.isPending || cooldownTime > 0 || isSuccess}
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
              disabled={verifyPassword.isPending || !password.trim() || cooldownTime > 0 || isSuccess}
              className={cn(
                "w-full h-14 text-lg font-bold rounded-2xl transition-all duration-200 shadow-lg focus:ring-2 focus:ring-sky-400/50 focus:ring-offset-2 focus:ring-offset-zinc-950",
                isSuccess 
                  ? 'bg-blue-500 hover:bg-blue-500 text-white' 
                  : 'bg-sky-400 hover:bg-sky-500 text-zinc-900 hover:shadow-xl hover:shadow-sky-400/25 hover:scale-[1.02] active:scale-[0.98]',
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              )}
            >
              {isSuccess ? (
                <m.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  </div>
                  Unlocking...
                </m.div>
              ) : verifyPassword.isPending ? (
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

        {/* Success overlay */}
        {isSuccess && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <m.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-8 bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <m.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                    className="w-6 h-6 text-white"
                  >
                    ✓
                  </m.div>
                </div>
                <p className="text-blue-400 font-semibold">Access Granted</p>
              </div>
            </m.div>
          </m.div>
        )}
      </m.div>
    </div>
  )
}