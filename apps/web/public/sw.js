// Service Worker for intelligent caching with memory optimization
const _CACHE_NAME = `v0-trailer-${Date.now()}`
const STATIC_CACHE = `static-${Date.now()}`
const DYNAMIC_CACHE = `dynamic-${Date.now()}`
const IMAGE_CACHE = `images-${Date.now()}`

// Memory-based cache for frequently accessed thumbnails
const MEMORY_CACHE = new Map()
const MEMORY_CACHE_LIMIT = 50 // Store up to 50 images in memory
const MEMORY_CACHE_TTL = 30 * 60 * 1000 // 30 minutes

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
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== IMAGE_CACHE) {
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
    
    // Images - Smart Image Cache with memory optimization
    if (isImageRequest(url)) {
      return await smartImageCache(request)
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

// Cache First strategy - reduced caching time
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    // Check if cached response is older than 1 hour
    const cachedDate = cachedResponse.headers.get('date')
    if (cachedDate) {
      const cacheTime = new Date(cachedDate).getTime()
      const now = Date.now()
      const oneHour = 60 * 60 * 1000
      
      if (now - cacheTime > oneHour) {
        // Cache is stale, delete and fetch fresh
        const cache = await caches.open(cacheName)
        await cache.delete(request)
      } else {
        return cachedResponse
      }
    } else {
      return cachedResponse
    }
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
  } catch {
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Offline', { status: 503 })
  }
}

// Smart Image Cache with memory optimization and stale-while-revalidate
async function smartImageCache(request) {
  const url = request.url
  const cacheKey = url
  
  // Check memory cache first (fastest)
  const memoryEntry = MEMORY_CACHE.get(cacheKey)
  if (memoryEntry && Date.now() - memoryEntry.timestamp < MEMORY_CACHE_TTL) {
    console.log('[SW] Serving from memory cache:', url)
    return new Response(memoryEntry.blob, {
      headers: memoryEntry.headers
    })
  }
  
  // Check disk cache second
  const cachedResponse = await caches.match(request)
  
  // Start network request in background for revalidation
  const networkPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      // Store in disk cache
      const imageCache = await caches.open(IMAGE_CACHE)
      imageCache.put(request, networkResponse.clone())
      
      // Store in memory cache if it's a thumbnail
      if (isVideoThumbnail(url)) {
        const blob = await networkResponse.clone().blob()
        const headers = {}
        for (const [key, value] of networkResponse.headers.entries()) {
          headers[key] = value
        }
        
        // Manage memory cache size
        if (MEMORY_CACHE.size >= MEMORY_CACHE_LIMIT) {
          const oldestKey = MEMORY_CACHE.keys().next().value
          MEMORY_CACHE.delete(oldestKey)
        }
        
        MEMORY_CACHE.set(cacheKey, {
          blob,
          headers,
          timestamp: Date.now()
        })
        
        console.log('[SW] Cached thumbnail in memory:', url)
      }
    }
    return networkResponse
  }).catch((error) => {
    console.log('[SW] Network failed for image:', url, error)
    return cachedResponse
  })
  
  // Return cached response immediately if available, otherwise wait for network
  if (cachedResponse) {
    console.log('[SW] Serving from disk cache (stale-while-revalidate):', url)
    // Background revalidation continues
    networkPromise.catch(() => {}) // Prevent unhandled promise rejection
    return cachedResponse
  }
  
  // No cache available, wait for network
  console.log('[SW] No cache, waiting for network:', url)
  return networkPromise
}

// Memory cache cleanup (periodic)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of MEMORY_CACHE.entries()) {
    if (now - entry.timestamp > MEMORY_CACHE_TTL) {
      MEMORY_CACHE.delete(key)
      console.log('[SW] Cleaned up expired memory cache entry:', key)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes

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

function isVideoThumbnail(url) {
  return url.includes('videodelivery.net') && 
         (url.includes('/thumbnails/') || url.includes('thumbnail.jpg'))
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
