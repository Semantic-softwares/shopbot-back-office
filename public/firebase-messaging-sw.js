// Firebase Cloud Messaging — background push handler for staff on-duty table
// order alerts. Runs in the service worker context, so it can't import
// src/environments/*.ts — fill in the same firebaseConfig values here AND in
// environment.ts/environment.prod.ts when the real Firebase project is ready.
//
// Registered automatically by firebase/messaging's getToken() (default lookup
// path is /firebase-messaging-sw.js at the site root, which is why this file
// lives in public/ rather than src/assets/ — see angular.json's assets config).
//
// Note: this app also registers Angular's own PWA asset-caching service
// worker (ngsw-worker.js) at the same root scope (see app.config.ts). Two
// service workers can coexist at one scope, but it's worth a real device test
// once Firebase credentials are in place — if push delivery is flaky, the fix
// is usually either scoping this SW under a subpath or merging the two.

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyALKWXDUQHGAf2nwjQ1eDN-zOApIlRiM4k',
  authDomain: 'foodie-6d808.firebaseapp.com',
  projectId: 'foodie-6d808',
  storageBucket: 'foodie-6d808.firebasestorage.app',
  messagingSenderId: '883466824651',
  appId: '1:883466824651:web:373261f8a1907bfe84a44e',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'New table order';
  const body = payload.notification?.body || '';

  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192x192.png',
    data: payload.data,
    tag: payload.data?.orderId ? `table-order-${payload.data.orderId}` : undefined,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Deep-link straight to the order that triggered the alert. Falls back to
  // the list when there's no id (e.g. a test push without one).
  const orderId = event.notification.data && event.notification.data.orderId;
  const path = orderId ? `/#/menu/pos/orders/${orderId}/details` : '/#/menu/pos/orders/list';

  // Reuse an already-open tab where possible rather than piling up windows —
  // the app is a SPA, so navigating the existing client is the better UX.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            return client.navigate(path).then((c) => c && c.focus());
          }
          return client.focus();
        }
      }
      return self.clients.openWindow(path);
    }),
  );
});
