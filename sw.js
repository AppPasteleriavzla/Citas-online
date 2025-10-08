// sw.js

// Escucha eventos de push
self.addEventListener('push', event => {
  const data = event.data.json(); // Recibimos los datos de la notificación
  
  const title = data.title || 'BarberConnect';
  const options = {
    body: data.body,
    icon: './icon-192.png', // Debes crear un ícono para tu app
    badge: './badge-72.png', // Y un badge pequeño
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
