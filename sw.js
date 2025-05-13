const CACHE_NAME = 'json-cache-v1';
const JSON_URLS = ['data/data.json', 'data/se.json'];

// Cache JSON on install

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(JSON_URLS);
    }).catch(err => {
      console.error('Caching failed:', err);
    })
  );
});

// Serve JSON from cache
self.addEventListener('fetch', event => {
  if (event.request.url.endsWith(JSON_URLS[0]) || event.request.url.endsWith(JSON_URLS[1])) {
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }

        return fetch(event.request).then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  }
});
