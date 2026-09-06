/* Lastro.IA — service worker
   Guarda a casca do app para abrir rápido e funcionar offline.
   Dados nunca são cacheados: eles vêm do Supabase, sempre da rede. */
const CACHE = 'lastro-v1';
const CASCA = ['./', './index.html', './manifest.webmanifest',
               './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CASCA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // qualquer chamada ao Supabase ou a APIs vai direto para a rede
  if (e.request.method !== 'GET' || !url.origin.startsWith(self.location.origin)) return;

  // rede primeiro, cache como rede de segurança: assim uma versão nova
  // do app chega sem o usuário precisar limpar nada.
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
