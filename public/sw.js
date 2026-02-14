// PART 1: FIREBASE MESSAGING (Push Notifications)
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

const firebaseConfig = {
  "projectId": "studio-9145223887-757dc",
  "appId": "1:154400695338:web:04e371c9f1946cac490f53",
  "apiKey": "AIzaSyDPonZuJ2vcfl4jsrtwkpnb6mJWq0b5DFg",
  "authDomain": "studio-9145223887-757dc.firebaseapp.com",
  "storageBucket": "studio-9145223887-757dc.appspot.com",
  "messagingSenderId": "154400695338"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: payload.data,
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});


// PART 2: PWA OFFLINE CACHING
const CACHE_NAME = 'safar-gate-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/favicon.ico',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened PWA cache');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old PWA cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Network-first strategy for navigation and sensitive data
    if (request.mode === 'navigate' || request.url.includes('/api/')) {
        event.respondWith(
            fetch(request).catch(() => {
                return caches.match(request).then(cachedResponse => {
                    return cachedResponse || caches.match('/');
                });
            })
        );
        return;
    }

    // Cache-first strategy for static assets
    if (request.destination === 'image' || request.destination === 'font' || request.destination === 'style' || request.destination === 'script') {
        event.respondWith(
            caches.match(request).then(cachedResponse => {
                return cachedResponse || fetch(request).then(networkResponse => {
                    // Optional: Cache new static assets on the fly
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }
});
