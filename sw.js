// sw.js - Versión Final Mejorada

// v1: Versión de la caché. Cámbiala si actualizas los archivos estáticos.
const CACHE_NAME = 'citas-online-cache-v1';

// Archivos esenciales de la "App Shell" que se deben cachear.
// (Estos son los mismos que tú tenías)
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
// --- ¡Esta sección no se modificó, ya estaba perfecta! ---
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
// --- GESTIÓN DE NOTIFICACIONES PUSH (MEJORADA) ---
// --- ¡Aquí está la nueva lógica! ---
// -----------------------------------------------------

// Evento 'push': Se dispara cuando el servidor envía una notificación.
self.addEventListener('push', event => {
  console.log('[Service Worker] Notificación Push recibida.');
  
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error("Error al leer la data de la push notification", e);
    return; // No se puede hacer nada sin data
  }

  // --- LÓGICA DE DECISIÓN (LA MEJORA) ---
  // Revisa si es un mensaje de chat (el 'type' que definimos en la Edge Function)
  if (data.type === 'chat_message') {
    // --- LÓGICA PARA MENSAJES DE CHAT ---
    console.log("Manejando como CHAT.");
    const title = data.title; // Título es el nombre del remitente (Ej: "Juan Pérez")
    const options = {
      body: data.body,         // Cuerpo es el mensaje (Ej: "Hola, ¿cómo estás?")
      icon: data.icon || './logo-maskable-192.png', // Ícono es el avatar del remitente (o un fallback)
      badge: './logo-maskable-192.png', // Un ícono genérico para la barra
      data: {
        url: data.url // URL para abrir (index.html o Cliente.html)
      }
    };
    event.waitUntil(self.registration.showNotification(title, options));

  } else {
    // --- LÓGICA PARA CITAS (O CUALQUIER OTRA NOTIF) ---
    // (Esta es la lógica que ya tenías, que funciona para tus notificaciones de citas)
    console.log("Manejando como CITA (o genérica).");
    const title = data.title || 'BarberConnect'; // Título genérico
    const options = {
      body: data.body,
      icon: './logo-192.png', // Ícono genérico de la app
      badge: './logo-maskable-192.png',
      data: {
        url: data.url || './index.html' // URL de fallback
      }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Evento 'notificationclick': Se dispara cuando el usuario hace clic en la notificación.
// (MEJORADO para no abrir pestañas duplicadas)
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Clic en notificación recibido.');
  
  event.notification.close(); // Cierra la notificación

  const urlToOpen = event.notification.data.url || './'; // URL a abrir

  // Lógica avanzada para enfocar la ventana si ya está abierta
  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true // Importante para que funcione bien
    }).then(clientList => {
      
      // Buscar si hay una ventana con esa URL
      // Usamos 'includes' para que funcione bien con la URL base
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          console.log("Enfocando cliente existente.");
          return client.focus();
        }
      }
      
      // Si no se encontró una ventana, abrir una nueva
      if (clients.openWindow) {
        console.log("Abriendo nueva ventana.");
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
