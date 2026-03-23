const CACHE_NAME = 'into-the-frame-v4';

// All files to cache for offline use
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './bosque_setas.html',
  './MesaTe.html',
  './Castillo.html',
  './css/door-funtions.css',
  './css/bosque_setas.css',
  './css/dialog.css',
  './js/door_funtions.js',
  './js/movement.js',
  './js/bosque_setas.js',
  './js/chess.js',
  './js/MinijuegoBaldosas.js',
  './js/resizeManager.js',
  './js/startAudioOnClick.js',
  './js/dialog.js',
  './manifest.json',
  // External libraries (cached on first load)
  'https://aframe.io/releases/1.7.0/aframe.min.js',
  'https://cdn.jsdelivr.net/gh/MozillaReality/ammo.js@8bbc0ea/builds/ammo.wasm.js',
  'https://cdn.jsdelivr.net/gh/c-frame/aframe-physics-system@v4.2.2/dist/aframe-physics-system.min.js',
  'https://unpkg.com/dexie@3/dist/dexie.js',
  'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.12.1/chess.min.js',
  'https://unpkg.com/aframe-environment-component@1.5.x/dist/aframe-environment-component.min.js',
  'https://unpkg.com/aframe-extras@6.1.1/dist/aframe-extras.min.js'
];

// Install: cache all core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
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

// Fetch: NETWORK FIRST, fallback to cache (ensures updates are always visible)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).then((response) => {
      // Got network response — cache it and return
      if (response && response.status === 200) {
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    }).catch(() => {
      // Network failed — serve from cache (offline mode)
      return caches.match(event.request).then((cached) => {
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
      });
    })
  );
});
