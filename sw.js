// Network-first pro všechny lokální soubory — vždy aktuální verze, cache jen jako fallback offline
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    e.respondWith(
        fetch(e.request)
            .then(r => {
                const clone = r.clone();
                caches.open('garaz').then(c => c.put(e.request, clone));
                return r;
            })
            .catch(() => caches.match(e.request))
    );
});
