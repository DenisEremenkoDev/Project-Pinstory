// Minimal service worker — its only job is to satisfy the browser's
// installability requirement so "Add to Home Screen" is offered. No caching
// strategy: this product doesn't promise offline support (yet).
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // Intentionally empty — a registered fetch handler is what browsers check for.
})
