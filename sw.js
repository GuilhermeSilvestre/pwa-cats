const CACHE_NAME = 'cats-v1';
const ASSETS = [
  './',
  './index.html',
  './icon.png',
  './manifest.json'
];

// Instala o Service Worker e guarda os arquivos estáticos no cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // Força o SW novo a ativar imediatamente
});

// Ativa e remove caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // Assume o controle da página na hora
});

// Estratégia de Fetch
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // SE FOR O SEU JSON: Não passa pelo cache do Service Worker, vai direto para a rede
  if (url.pathname.includes('dados.json')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Para os outros arquivos (HTML, Ícone, Manifest), usa Stale-While-Revalidate
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Se estiver totalmente offline e falhar a rede, não quebra o app
      });

      return cachedResponse || fetchPromise;
    })
  );
});