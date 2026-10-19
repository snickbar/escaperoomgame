const CACHE_NAME = 'escape-room-v41';
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
  './story-content.js',
  './adventure-engine.js',
  './app-ui.js',
  './story-assets.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  ...ITEM_ART_THEMES.flatMap((theme) => [
    `./art/items/${theme}-a.jpg`,
    `./art/items/${theme}-b.jpg`,
    `./art/items/${theme}-c.jpg`,
  ]),
];

self.addEventListener('install', event => {
  event.waitUntil((async()=> {
    const response=await fetch('./story-assets.json',{cache:'no-store'});
    if(!response.ok) throw Error('Story artwork list unavailable');
    const storyAssets=await response.json();
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll([...ASSETS,...storyAssets]);
  })());
});

self.addEventListener('message',event=> {
  if(event.data?.type==='APPLY_UPDATE') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith('escape-room-') && key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if(event.request.method!=='GET' || new URL(event.request.url).origin!==self.location.origin) return;
  if(event.request.mode==='navigate') {
    // HTML and its scripts must come from the same release while an update waits.
    event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(cached=>cached || fetch(event.request)));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
