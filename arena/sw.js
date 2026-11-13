/* Airron's Fall offline cache. Scope is the game base (e.g. / or /arena/). */
const CACHE = 'airrons-fall-shell-v4';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  );
});

const isAudio = (url) => /\.(mp3|ogg|wav|m4a)(\?|$)/i.test(url.pathname);
const isHashedAsset = (url, scope) =>
  url.pathname.startsWith(new URL('assets/', scope).pathname) &&
  !isAudio(url);

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  const scope = self.registration.scope;
  if (!url.href.startsWith(scope)) return;
  if (isAudio(url)) return;

  if (isHashedAsset(url, scope)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  // HTML and other shell files: network first, fall back to cache.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.destination === 'document') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || Promise.reject(new Error('offline')))),
  );
});
