// Service Worker for aggressive caching
const CACHE_NAME = 'v0-trailer-v1.0.0'
const STATIC_CACHE = 'static-v1.0.0'
const DYNAMIC_CACHE = 'dynamic-v1.0.0'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/gallery',
  '/enter',
  '/manifest.json',
  '/neversatisfiedxo-logo.png',
  '/favicon.ico'
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/trailers/,
  /\/api\/trailers\/[^\/]+/,
  /\/api\/health/
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Service worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }
  
  event.respondWith(handleRequest(request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  try {
    // Static assets - Cache First strategy
    if (isStaticAsset(url)) {
      return await cacheFirst(request, STATIC_CACHE)
    }
    
    // API requests - Stale While Revalidate strategy
    if (isApiRequest(url)) {
      return await staleWhileRevalidate(request, DYNAMIC_CACHE)
    }
    
    // Images - Cache First strategy
    if (isImageRequest(url)) {
      return await cacheFirst(request, DYNAMIC_CACHE)
    }
    
    // Other requests - Network First strategy
    return await networkFirst(request, DYNAMIC_CACHE)
    
  } catch (error) {
    console.error('[SW] Error handling request:', error)
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return await caches.match('/') || new Response('Offline', { status: 503 })
    }
    
    // Return cached version if available
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return error response
    return new Response('Network error', { status: 503 })
  }
}

// Cache First strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  const networkResponse = await fetch(request)
  if (networkResponse.ok) {
    const cache = await caches.open(cacheName)
    cache.put(request, networkResponse.clone())
  }
  
  return networkResponse
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request)
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(cacheName)
      cache.then(c => c.put(request, networkResponse.clone()))
    }
    return networkResponse
  }).catch(() => cachedResponse)
  
  return cachedResponse || fetchPromise
}

// Network First strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Offline', { status: 503 })
  }
}

// Helper functions
function isStaticAsset(url) {
  return STATIC_ASSETS.includes(url.pathname) || 
         url.pathname.startsWith('/_next/static/') ||
         url.pathname.startsWith('/static/')
}

function isApiRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))
}

function isImageRequest(url) {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i) ||
         url.hostname.includes('videodelivery.net') ||
         url.hostname.includes('imagedelivery.net')
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  console.log('[SW] Performing background sync...')
  // Implement background sync logic here
}

// Push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/neversatisfiedxo-logo.png',
      badge: '/favicon.ico',
      tag: 'v0-trailer-notification'
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})
