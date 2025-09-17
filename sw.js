// Service Worker for Siber Macera Game
// Kiosk mode ve offline çalışma için gerekli

const CACHE_NAME = 'siber-macera-v1.3';
const urlsToCache = [
  './',
  './index.html',
  './scoreboard.html', 
  './style.css',
  './firebase-config.js',
  './manifest.json',
  // Assets - Ana oyun görselleri
  './assets/Asset 4.svg',
  './assets/Asset 5.svg',
  './assets/Asset 6.svg',
  './assets/Asset 9.svg',
  './assets/Asset 10.svg',
  './assets/Asset 11.svg',
  './assets/Asset 12.svg',
  './assets/Asset 13.svg',
  './assets/Asset 14.svg',
  './assets/Asset 15.svg',
  './assets/Asset 22.svg',
  './assets/Asset 23.svg',
  './assets/Asset 26.svg',
  './assets/Asset 27.svg',
  './assets/Asset 28.svg',
  './assets/Asset 29.svg',
  './assets/Asset 30.svg',
  './assets/Asset 31.svg',
  './assets/Asset 32.svg',
  './assets/Asset 33.svg',
  './assets/Asset 34.svg',
  './assets/Asset 35.svg',
  './assets/Asset 36.svg',
  './assets/Asset 37.svg',
  './assets/Asset 38.svg',
  './assets/Asset 39.svg',
  // Özel buton görselleri
  './assets/anaekranadon.svg',
  './assets/oyungirisekranı.svg',
  './assets/oltalamatestinegec.svg',
  // Fonts
  './fonts/Gilmer Regular.otf',
  './fonts/Gilmer Light.otf',
  './fonts/Gilmer Bold.otf',
  './fonts/conthrax-sb.otf',
  // External libraries
  'https://cdnjs.cloudflare.com/ajax/libs/zxcvbn/4.4.2/zxcvbn.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('Service Worker: Cache failed', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if(cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetching', event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          console.log('Service Worker: Returning cached', event.request.url);
          return response;
        }
        
        // Try to fetch from network
        return fetch(event.request).then(fetchResponse => {
          // Cache successful responses
          if (fetchResponse.status === 200) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return fetchResponse;
        }).catch(() => {
          console.log('Service Worker: Network failed for', event.request.url);
          
          // Offline fallbacks
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
          
          // SVG fallback for missing assets
          if (event.request.url.includes('.svg')) {
            const fileName = event.request.url.split('/').pop();
            console.log('Service Worker: SVG fallback for', fileName);
            
            // Create fallback SVG based on filename
            let fallbackSVG = '';
            if (fileName.includes('anaekranadon') || fileName.includes('Asset 22')) {
              fallbackSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="50" viewBox="0 0 120 50">
                <rect width="120" height="50" fill="#ff6600" rx="8"/>
                <text x="60" y="32" text-anchor="middle" fill="white" font-family="Arial" font-size="14">Ana Ekran</text>
              </svg>`;
            } else if (fileName.includes('oltalamatestinegec')) {
              fallbackSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="350" height="60" viewBox="0 0 350 60">
                <rect width="350" height="60" fill="#ff3366" rx="10"/>
                <text x="175" y="38" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">OLTALAMA TESTİNE GEÇ</text>
              </svg>`;
            } else {
              fallbackSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40" viewBox="0 0 100 40">
                <rect width="100" height="40" fill="#666" rx="5"/>
                <text x="50" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="12">Buton</text>
              </svg>`;
            }
            
            return new Response(fallbackSVG, {
              headers: { 'Content-Type': 'image/svg+xml' }
            });
          }
          
          // Generic fallback
          return new Response('Offline - dosya bulunamadı', { status: 404 });
        });
      })
  );
});

// Background sync for score updates when connection returns
self.addEventListener('sync', event => {
  if (event.tag === 'sync-scores') {
    console.log('Service Worker: Syncing scores...');
    event.waitUntil(syncScores());
  }
});

// Function to sync offline scores
function syncScores() {
  // This would handle syncing scores when connection is restored
  return new Promise((resolve) => {
    // Implementation depends on your offline score storage strategy
    console.log('Service Worker: Scores synced');
    resolve();
  });
}

// Kiosk mode helper - prevent right click, selection etc.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'ENABLE_KIOSK_MODE') {
    // Send message to main thread to enable kiosk restrictions
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'KIOSK_MODE_ENABLED',
          restrictions: {
            preventRightClick: true,
            preventSelection: true,
            preventDevTools: true,
            fullscreen: true
          }
        });
      });
    });
  }
});

// Push notification support for kiosk mode management
self.addEventListener('push', event => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'Siber Macera güncellendi',
    icon: './assets/icon-192x192.png',
    badge: './assets/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Oyunu Aç',
        icon: './assets/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Kapat',
        icon: './assets/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Siber Macera', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

