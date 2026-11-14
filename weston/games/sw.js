/* Weston's games: network first, cache fallback, so games still open on weak Wi-Fi. Same-origin GETs only. */
var C = 'weston-games-v1';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(function (res) { if (res.ok) { var cp = res.clone(); caches.open(C).then(function (c) { c.put(r, cp); }); } return res; })
    .catch(function () { return caches.match(r, { ignoreSearch: true }); }));
});
