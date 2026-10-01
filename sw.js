/**
 * Service Worker for CareerPilot Job Hunt Tracker
 * Provides offline caching for seamless mobile & desktop performance
 */
const CACHE_NAME = 'careerpilot-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/kanban.css',
  './css/table.css',
  './css/calendar.css',
  './css/modal.css',
  './css/notifications.css',
  './js/app.js',
  './js/storage.js',
  './js/cloudSync.js',
  './js/notifications.js',
  './js/kanbanView.js',
  './js/tableView.js',
  './js/calendarView.js',
  './js/statsView.js',
  './js/prepView.js',
  './js/initialData.js',
  './assets/favicon.png',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Some cache items failed, continuing:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same origin or cache
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cache but update in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
