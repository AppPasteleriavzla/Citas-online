// sw.js - Versión Mejorada

// Define un nombre para la caché y los archivos que se almacenarán.
const CACHE_NAME = 'barberconnect-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json', // Es buena práctica cachear el manifest también
  '/logo-192.png',
  '/logo-512.png'
];

// --- MEJORA 1: Evento 'install' ---
// Se dispara cuando el Service Worker se instala por primera vez.
// Aquí guardamos los archivos principales de la app en la caché.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache abierta y archivos guardados');
        return cache.addAll(urlsToCache);
      })
  );
});

// --- MEJORA 2: Evento 'fetch' ---
// Se dispara cada vez que la app hace una petición (ej. cargar una página o imagen).
// Esto permite que la app funcione sin conexión.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si encontramos una respuesta en la caché, la devolveemos.
        if (response) {
          return response;
        }
        // Si no, intentamos obtenerla de la red.
        return fetch(event.request);
      }
    )
  );
});


// --- TU CÓDIGO ACTUAL (INTEGRADO Y CORREGIDO) ---

// Escucha eventos de push
self.addEventListener('push', event => {
  const data = event.data.json(); // Recibimos los datos de la notificación
  
  const title = data.title || 'BarberConnect';
  const options = {
    body: data.body,
    icon: './logo-192.png', // CORREGIDO: Usando el ícono de tu manifest.json
    badge: './logo-192.png', // CORREGIDO: Usando un ícono válido como insignia
    data: {
      url: data.url || '/' // URL a la que ir al hacer clic
    }
  };

  // Muestra la notificación
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Escucha el clic en la notificación
self.addEventListener('notificationclick', event => {
  event.notification.close(); // Cierra la notificación

  // Abre la URL asociada a la notificación
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
