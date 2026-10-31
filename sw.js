// Service Worker pour Dunkirk RDV Mobile
const CACHE_NAME = 'dunkirk-rdv-v7';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
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
  // Ne pas cacher les requêtes externes API Baserow / Geocoding
  if (event.request.url.includes('baserow') || 
      event.request.url.includes('api-adresse.data.gouv.fr') || 
      event.request.url.includes('nominatim') ||
      event.request.url.includes('osrm')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// =========================================================================
// GESTION DES NOTIFICATIONS EN ARRIÈRE-PLAN (APPLICATION FERMÉE)
// =========================================================================

// 1. Réception d'une notification Push depuis le réseau
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Dunkirk RDV", body: event.data.text() };
    }
  }

  const title = data.title || "📅 Nouveau rendez-vous Dunkirk";
  const options = {
    body: data.body || "Un rendez-vous a été enregistré dans le planning.",
    icon: data.icon || "./icons/icon-192.png",
    badge: data.badge || "./icons/icon-192.png",
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || ("dunkirk-rdv-" + Date.now()),
    renotify: true,
    requireInteraction: true,
    data: data.data || { url: "./" }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 2. Clic sur la notification par l'utilisateur
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la ramener au premier plan
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Sinon, ouvrir l'application
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
