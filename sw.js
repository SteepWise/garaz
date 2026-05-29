const CACHE = 'garaz-v3';
const STATIC = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    // CDN zdroje — network first, cache fallback
    if (e.request.url.includes('cdn') || e.request.url.includes('cloudflare')) {
        e.respondWith(
            fetch(e.request)
                .then(r => {
                    const clone = r.clone();
                    caches.open(CACHE).then(c => c.put(e.request, clone));
                    return r;
                })
                .catch(() => caches.match(e.request))
        );
        return;
    }
    // Lokální soubory — cache first
    e.respondWith(
        caches.match(e.request).then(cached =>
            cached || fetch(e.request).then(r => {
                const clone = r.clone();
                caches.open(CACHE).then(c => c.put(e.request, clone));
                return r;
            })
        )
    );
});
