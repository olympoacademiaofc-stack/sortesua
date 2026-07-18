const CACHE = 'sorte-sua-v3'

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(networkFirst(request))
    return
  }

  event.respondWith(cacheFirst(request))
})

async function cacheFirst(request) {
  const url = new URL(request.url)
  const cleanReq = url.origin + url.pathname
  const cached = await caches.match(cleanReq)
  if (cached) return cached
  try {
    const res = await fetch(request)
    if (res.ok) {
      const copy = res.clone()
      caches.open(CACHE).then(cache => cache.put(cleanReq, copy))
    }
    return res
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request) {
  try {
    const res = await fetch(request)
    if (res.ok) {
      const copy = res.clone()
      caches.open(CACHE).then(cache => cache.put(request, copy))
    }
    return res
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: 'Sem conexão' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
