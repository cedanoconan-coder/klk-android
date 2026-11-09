const CACHE_NAME = "klk-shell-v22";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./calls.js", "./navigation.js"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(request).then(response => {
    if (response && response.ok) {
      // No guardar enlaces de invitación: contienen códigos privados de un solo uso.
      const hasInviteCode = new URL(request.url).searchParams.has("invite");
      if (!hasInviteCode) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
    }
    return response;
  }).catch(() => caches.match(request).then(cached => cached || caches.match("./index.html"))));
});
