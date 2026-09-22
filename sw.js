const CACHE_NAME = 'escape-room-v19';
const ITEM_ART_THEMES = [
  'bike-tire', 'camera', 'campfire', 'candle', 'cut-fence', 'fish-hook',
  'flashlight', 'mirror', 'old-diary', 'parrot-cage', 'pencil', 'rose',
  'rune-tablet', 'safe', 'tea', 'vial',
];
const ASSETS = [
  './',
  './index.html',
  './gallery.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  ...ITEM_ART_THEMES.flatMap((theme) => [
    `./art/items/${theme}-a.jpg`,
    `./art/items/${theme}-b.jpg`,
    `./art/items/${theme}-c.jpg`,
  ]),
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
