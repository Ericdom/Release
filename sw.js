const CACHE_NAME = 'release-cache-v47'; // Incremented version
const ASSETS = [
    '/',
    'index.html',
    'css/styles.css',
    'js/liquid-bg.js',
    'manifest.json',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@100;300;400;600;900&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@100;300;400&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'index/waitlist.webp',
    'index/white.jpeg',
    'index/blue_butterfly.webp',
    'index/1 (1).webp',
    'index/1 (2).webp',
    'index/1 (3).webp',
    'index/1 (4).webp',
    'index/916/white.jpeg',
    'index/916/blue_butterfly.webp',
    'index/916/1 (1).webp',
    'index/916/1 (2).webp',
    'index/916/1 (3).webp',
    'index/916/1 (4).webp'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Individual caching to prevent failure if one asset is missing
            return Promise.allSettled(
                ASSETS.map(asset => {
                    return cache.add(asset).catch(err => {
                        console.warn(`[SW] Failed to cache asset: ${asset}`, err);
                    });
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Network First for HTML, Stale-While-Revalidate for others
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        event.respondWith(
            caches.match(event.request).then((response) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
                    return networkResponse;
                });
                return response || fetchPromise;
            })
        );
    }
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(), // Take control of all clients
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
        ])
    );
});
