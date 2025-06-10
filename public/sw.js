// Advanced Service Worker for Performance Optimization
const CACHE_NAME = 'dedw3n-v1.2.0';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const TRANSLATION_CACHE = 'translations-v1';
const VIDEO_CACHE = 'videos-v1';

// Critical assets to preload
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/src/index.css',
  '/src/main.tsx',
  '/api/products',
  '/api/categories',
  '/api/user'
];

// Video assets for marketplace
const VIDEO_ASSETS = [
  '/attached_assets/Cafe_1749419425062.mp4',
  '/attached_assets/Be yourself_1749419131578.mp4',
  '/attached_assets/car selling online _1749419270298.mp4'
];

// Critical marketplace images
const IMAGE_ASSETS = [
  '/attached_assets/Dedw3n Business B2C Header new_1749416893159.png',
  '/attached_assets/Dedw3n Business C2c header_1749418133958.png',
  '/attached_assets/Dedw3n Business B2C Footer new 2_1749417170052.png'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(CRITICAL_ASSETS);
      }),
      caches.open(VIDEO_CACHE).then((cache) => {
        // Preload first frames of videos only
        return Promise.allSettled(
          VIDEO_ASSETS.map(video => 
            fetch(video, { headers: { 'Range': 'bytes=0-1024' } })
              .then(response => cache.put(video + '-preview', response))
          )
        );
      })
    ]).then(() => {
      console.log('[SW] Critical assets cached');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== TRANSLATION_CACHE &&
              cacheName !== VIDEO_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different resource types with optimized strategies
  if (url.pathname.includes('/api/translate')) {
    event.respondWith(handleTranslationRequest(event.request));
  } else if (url.pathname.includes('.mp4') || url.pathname.includes('.webm')) {
    event.respondWith(handleVideoRequest(event.request));
  } else if (url.pathname.includes('/api/')) {
    event.respondWith(handleAPIRequest(event.request));
  } else if (url.pathname.includes('/attached_assets/')) {
    event.respondWith(handleStaticAsset(event.request));
  } else {
    event.respondWith(handleNavigationRequest(event.request));
  }
});

// Translation caching with intelligent fallback
async function handleTranslationRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(TRANSLATION_CACHE);
  
  try {
    // Try cache first for translations
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      const cacheDate = new Date(cachedResponse.headers.get('date'));
      const isExpired = Date.now() - cacheDate.getTime() > 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (!isExpired) {
        console.log('[SW] Translation cache hit');
        return cachedResponse;
      }
    }

    // Network request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const networkResponse = await fetch(request, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (networkResponse.ok) {
      // Cache successful translation response
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
      console.log('[SW] Translation cached');
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Translation network failed, checking cache');
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return fallback response maintaining original text
    return new Response(JSON.stringify({
      translatedText: 'Translation unavailable',
      error: 'Network error'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Video caching with range support
async function handleVideoRequest(request) {
  const cache = await caches.open(VIDEO_CACHE);
  const url = new URL(request.url);
  
  try {
    // Check if we have a cached version
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Video cache hit');
      return cachedResponse;
    }

    // For video requests, support range requests
    const response = await fetch(request);
    
    if (response.ok) {
      // Only cache smaller video segments to avoid memory issues
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) < 50 * 1024 * 1024) { // 50MB limit
        const responseClone = response.clone();
        cache.put(request, responseClone);
        console.log('[SW] Video segment cached');
      }
    }

    return response;
  } catch (error) {
    console.log('[SW] Video request failed:', error);
    return new Response('Video unavailable', { status: 503 });
  }
}

// API caching with stale-while-revalidate
async function handleAPIRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const url = new URL(request.url);
  
  // Define which APIs to cache
  const cacheableAPIs = ['/api/products', '/api/categories', '/api/user'];
  const shouldCache = cacheableAPIs.some(api => url.pathname.includes(api));
  
  if (!shouldCache) {
    return fetch(request);
  }

  try {
    // Stale-while-revalidate strategy
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] API cache hit, revalidating in background');
      
      // Return cached version immediately
      const responsePromise = cachedResponse;
      
      // Update cache in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
          console.log('[SW] API cache updated');
        }
      }).catch(error => {
        console.log('[SW] Background API update failed:', error);
      });
      
      return responsePromise;
    }

    // No cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
      console.log('[SW] API response cached');
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] API request failed, trying cache');
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(JSON.stringify({ error: 'Network unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Static asset caching with long TTL
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  try {
    // Cache first strategy for static assets
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Static asset cache hit');
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
      console.log('[SW] Static asset cached');
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Static asset failed:', error);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Asset unavailable', { status: 503 });
  }
}

// Navigation requests with app shell
async function handleNavigationRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation network failed, serving app shell');
    
    // Fallback to cached index.html for SPA routing
    const cachedResponse = await cache.match('/index.html');
    return cachedResponse || new Response('Application unavailable', { 
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Background sync for critical operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-translation-sync') {
    console.log('[SW] Background translation sync');
    event.waitUntil(syncTranslations());
  }
});

// Sync cached translations when connection restored
async function syncTranslations() {
  const cache = await caches.open(TRANSLATION_CACHE);
  const requests = await cache.keys();
  
  const syncPromises = requests.map(async (request) => {
    try {
      const fresh = await fetch(request);
      if (fresh.ok) {
        await cache.put(request, fresh);
      }
    } catch (error) {
      console.log('[SW] Sync failed for:', request.url);
    }
  });
  
  return Promise.allSettled(syncPromises);
}

// Periodic cache cleanup
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    event.waitUntil(cleanupExpiredCache());
  }
});

async function cleanupExpiredCache() {
  console.log('[SW] Starting cache cleanup');
  
  const translationCache = await caches.open(TRANSLATION_CACHE);
  const requests = await translationCache.keys();
  
  const cleanupPromises = requests.map(async (request) => {
    const response = await translationCache.match(request);
    if (response) {
      const cacheDate = new Date(response.headers.get('date'));
      const isExpired = Date.now() - cacheDate.getTime() > 7 * 24 * 60 * 60 * 1000;
      
      if (isExpired) {
        await translationCache.delete(request);
        console.log('[SW] Cleaned expired translation cache:', request.url);
      }
    }
  });
  
  await Promise.all(cleanupPromises);
  console.log('[SW] Cache cleanup completed');
}