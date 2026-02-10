/**
 * Service Worker for Dashboard PWA
 * Handles caching, offline support, and background sync
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `dashboard-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/auth.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

const DATA_CACHE_NAME = `dashboard-data-${CACHE_VERSION}`;
const DATA_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error caching static assets:', error);
      })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event - Serve from cache or network
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle data API requests differently (network-first with cache fallback)
  if (isDataRequest(url)) {
    event.respondWith(handleDataRequest(request));
    return;
  }

  // Static assets: cache-first strategy
  event.respondWith(handleStaticRequest(request));
});

/**
 * Check if request is for data API
 */
function isDataRequest(url) {
  return url.pathname.includes('/webhook/') ||
         url.pathname.includes('/api/') ||
         url.pathname.endsWith('.json');
}

/**
 * Handle static asset requests (cache-first)
 */
async function handleStaticRequest(request) {
  try {
    // Try to get from cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, fetch from network
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed for static asset:', error);

    // Return cached version if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page or error
    return new Response('Offline - recurso não disponível', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

/**
 * Handle data API requests (network-first with cache fallback)
 */
async function handleDataRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      // Clone response for caching
      const responseToCache = networkResponse.clone();

      // Cache the fresh data
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, responseToCache);

      return networkResponse;
    }

    // If network response is not OK, fall back to cache
    return getCachedDataOrError(request);

  } catch (error) {
    console.log('[SW] Network request failed, using cache:', error);

    // Network failed, try cache
    return getCachedDataOrError(request);
  }
}

/**
 * Get cached data or return error response
 */
async function getCachedDataOrError(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Check if cached data is still fresh
    const cachedDate = new Date(cachedResponse.headers.get('date') || 0);
    const now = new Date();
    const age = now - cachedDate;

    if (age < DATA_CACHE_DURATION) {
      console.log('[SW] Serving fresh cached data');
      return cachedResponse;
    } else {
      console.log('[SW] Serving stale cached data (offline)');
      // Still return stale data if offline
      return cachedResponse;
    }
  }

  // No cache available
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'Sem dados em cache disponíveis'
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }
  );
}

/**
 * Handle messages from the main app
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

/**
 * Background Sync for failed requests (future enhancement)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[SW] Background sync triggered');
  // Implement background sync logic here if needed
}

/**
 * Push Notifications (future enhancement)
 */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'Nova atualização disponível',
    icon: '/assets/icon-192.png',
    badge: '/assets/badge.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'dashboard-notification',
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Dashboard', options)
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[SW] Service worker script loaded');
