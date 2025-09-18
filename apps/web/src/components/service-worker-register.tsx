'use client'

import { useEffect, useState } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerServiceWorker()
    }
  }, [])

  return null
}

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })

    console.log('[SW] Service Worker registered successfully:', registration)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, notify user
            console.log('[SW] New content available, please refresh')
            // You can show a notification to the user here
          }
        })
      }
    })

    // Handle controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Reload the page to get the latest content
      window.location.reload()
    })

  } catch (error) {
    console.error('[SW] Service Worker registration failed:', error)
  }
}

// Hook for checking if service worker is supported
export function useServiceWorker() {
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      setIsSupported(true)
      
      navigator.serviceWorker.getRegistration()
        .then(registration => {
          setIsRegistered(!!registration)
        })
    }
  }, [])

  return { isSupported, isRegistered }
}
