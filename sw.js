// sw.js - Versión Final

// v1: Versión de la caché. Cámbiala si actualizas los archivos estáticos.
const CACHE_NAME = 'citas-online-cache-v1';

// Archivos esenciales de la "App Shell" que se deben cachear.
const urlsToCache = [
  './',
  './index.html',
  './Cliente.html',
  './manifest.json',
  './logo-192.png',
  './logo-512.png',
  './logo-maskable-192.png',
  './logo-maskable-512.png',
  // URLs externas de librerías
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/qrcode-generator/qrcode.js'
];

// -------------------------------------------------------------------
// --- GESTIÓN DE CACHÉ E INSTALACIÓN (PARA FUNCIONAMIENTO OFFLINE) ---
// -------------------------------------------------------------------

// Evento 'install': Se dispara cuando el Service Worker se instala.
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache abierta. Cacheando archivos de la App Shell.');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento 'activate': Se dispara después de la instalación para limpiar cachés antiguas.
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Evento 'fetch': Intercepta las peticiones para servir desde la caché o la red.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Servir desde la caché
        }
        return fetch(event.request); // Pedir a la red si no está en caché
      })
  );
});


// -----------------------------------------------------
// --- GESTIÓN DE NOTIFICACIONES PUSH ---
// -----------------------------------------------------

// Evento 'push': Se dispara cuando el servidor envía una notificación.
self.addEventListener('push', event => {
  console.log('[Service Worker] Notificación Push recibida.');
  
  // Extraemos la información enviada desde el servidor.
  const data = event.data.json();
  
  const title = data.title || 'BarberConnect';
  const options = {
    body: data.body, // El texto principal de la notificación
    icon: './logo-192.png', // Ícono que se muestra en la notificación
    badge: './logo-192.png', // Ícono para la barra de estado (en Android)
    data: {
      url: data.url || './index.html' // URL a la que se irá al hacer clic
    }
  };

  // Muestra la notificación al usuario.
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Evento 'notificationclick': Se dispara cuando el usuario hace clic en la notificación.
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Clic en notificación recibido.');
  
  // Cierra la notificación.
  event.notification.close();

  // Abre la URL asociada a la notificación en una nueva ventana o pestaña.
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
