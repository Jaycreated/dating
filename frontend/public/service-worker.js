// Service Worker for Web Push Notifications
// This file should be placed in your frontend public folder

const CACHE_NAME = 'pairfect-cache-v1';

// Install event - cache basic assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event - claim clients immediately
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  if (!event.data) {
    console.log('[Service Worker] No push data received');
    return;
  }

  const data = event.data.json();
  console.log('[Service Worker] Push data:', data);

  const title = data.title || 'Pairfect';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction !== false,
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event - handle user clicking on notification
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event);

  event.notification.close();

  const notificationData = event.notification.data;
  let url = '/';

  // Navigate based on notification type
  if (notificationData) {
    switch (notificationData.type) {
      case 'match':
        url = notificationData.url || '/matches';
        break;
      case 'like':
        url = notificationData.url || '/swipe';
        break;
      case 'message':
        url = notificationData.url || `/chat/${notificationData.matchId}`;
        break;
      default:
        url = '/';
    }
  }

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (let client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
