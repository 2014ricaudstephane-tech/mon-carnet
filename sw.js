/* Mon Carnet - service worker
   Objectif : l'application s'ouvre meme sans reseau.
   Strategie : on met en cache le minimum vital a l'installation,
   puis on sert le cache d'abord (et on rafraichit en arriere-plan). */

const CACHE = "mon-carnet-v1";
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(FILES).catch(function () { /* un fichier absent ne doit pas tout bloquer */ });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then(function (cached) {
      const network = fetch(e.request).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return cached; });

      // cache d'abord (instantane), reseau en secours
      return cached || network;
    })
  );
});
