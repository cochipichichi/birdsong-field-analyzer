const CACHE_NAME = "birdsong-field-prod-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/audio-prod.js",
  "./js/network.js",
  "./js/controls.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k)))
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(
      (resp) =>
        resp ||
        fetch(event.request).catch(() =>
          caches.match("./index.html")
        )
    )
  );
});
