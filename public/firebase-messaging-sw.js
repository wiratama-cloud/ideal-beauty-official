importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Parse config from URL
const urlParams = new URLSearchParams(self.location.search);
const config = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId'),
};

firebase.initializeApp(config);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // If payload already contains a notification object, FCM SDK automatically displays it.
  // Calling showNotification manually here would cause duplicate notifications.
  if (payload.notification) {
    return;
  }

  // Handle data-only push messages
  if (payload.data) {
    const notificationTitle = payload.data.title || 'Ideal Beauty';
    const destinationUrl = payload.data.url || payload.data.link || '/';
    const notificationOptions = {
      body: payload.data.body || '',
      icon: payload.data.icon || '/icon.png',
      badge: payload.data.badge || '/icon.png',
      data: {
        url: destinationUrl,
        ...payload.data,
      },
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const rawUrl = event.notification.data?.url || event.notification.data?.link || '/';
  let urlToOpen = '/';
  try {
    urlToOpen = new URL(rawUrl, self.location.origin).href;
  } catch {
    urlToOpen = rawUrl || '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ((client.url === urlToOpen || client.url === rawUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
