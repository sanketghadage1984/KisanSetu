/* ═══════════════════════════════════════════════════════
   KisanSetu — Service Worker (Offline-First PWA)
   Cache static assets, handle offline, background sync
   ═══════════════════════════════════════════════════════ */

const CACHE_NAME = 'kisansetu-v1';
const STATIC_CACHE = 'kisansetu-static-v1';
const DATA_CACHE = 'kisansetu-data-v1';

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/data.js',
  '/js/translations.js',
  '/js/crop-icons.js',
  '/js/ai-engine.js',
  '/js/mandi-api.js',
  '/js/blockchain.js',
  '/js/govt-schemes.js',
  '/js/weather.js',
  '/manifest.json',
  '/pages/dashboard/dashboard.html',
  '/pages/dashboard/dashboard.css',
  '/pages/dashboard/dashboard.js',
  '/pages/add-crop/add-crop.html',
  '/pages/add-crop/add-crop.css',
  '/pages/add-crop/add-crop.js',
  '/pages/market/market.html',
  '/pages/market/market.css',
  '/pages/market/market.js',
  '/pages/offers/offers.html',
  '/pages/offers/offers.css',
  '/pages/offers/offers.js',
  '/pages/traders/traders.html',
  '/pages/traders/traders.css',
  '/pages/traders/traders.js',
  '/pages/profile/profile.html',
  '/pages/profile/profile.js',
  '/pages/login/login.html',
  '/pages/register/register.html',
  '/pages/trader-dashboard/trader-dashboard.html',
  '/pages/community/community.html',
  '/pages/community/community.css',
  '/pages/community/community.js'
];

// Install — Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      // Use addAll with catch so one missing file doesn't break install
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some assets failed to cache:', err);
        // Cache what we can individually
        return Promise.allSettled(
          STATIC_ASSETS.map(url => cache.add(url).catch(() => {}))
        );
      });
    })
  );
  self.skipWaiting();
});

// Activate — Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DATA_CACHE)
          .map((key) => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch — Strategy: Cache-first for static, Network-first for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Firebase/Firestore/Analytics/external SDK requests
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('gstatic.com') ||
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('cloudfunctions.net') ||
      url.hostname.includes('cloudinary.com')) {
    return;
  }

  // API calls (data.gov.in, weather) — Network first, cache fallback
  if (url.pathname.startsWith('/api/') ||
      url.hostname.includes('api.data.gov.in') ||
      url.hostname.includes('api.open-meteo.com')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DATA_CACHE).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || new Response(
              JSON.stringify({ error: 'offline', message: 'No cached data available' }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Static assets — Cache first, network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-ok responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          // Offline fallback for HTML pages
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
    })
  );
});

// Background Sync — Queue crop submissions made offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-crops') {
    event.waitUntil(syncOfflineCrops());
  }
  if (event.tag === 'sync-offers') {
    event.waitUntil(syncOfflineOffers());
  }
});

async function syncOfflineCrops() {
  // Read from IndexedDB queue and push to server
  console.log('[SW] Syncing offline crop submissions...');
}

async function syncOfflineOffers() {
  console.log('[SW] Syncing offline offer actions...');
}

// Push Notifications (future)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || '🌾 KisanSetu';
  const options = {
    body: data.body || 'You have a new update',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
