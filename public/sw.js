// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/mercedes-logo.png',
    badge: '/mercedes-logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      ...data
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/mercedes-logo.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/mercedes-logo.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Maintenance App', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.openWindow('/')
  );
});

self.addEventListener('install', function(event) {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});