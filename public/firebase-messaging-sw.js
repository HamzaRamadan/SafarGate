// DO NOT EDIT. This is a generated file.
// This file is a service worker that receives push notifications for your app.
// For more information, see https://firebase.google.com/docs/cloud-messaging/js/receive

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
  "projectId": "studio-9145223887-757dc",
  "appId": "1:154400695338:web:04e371c9f1946cac490f53",
  "apiKey": "AIzaSyDPonZuJ2vcfl4jsrtwkpnb6mJWq0b5DFg",
  "authDomain": "studio-9145223887-757dc.firebaseapp.com",
  "storageBucket": "studio-9145223887-757dc.appspot.com",
  "messagingSenderId": "154400695338"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png',
    data: {
      url: payload.fcmOptions.link
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  const link = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(windowClients => {
        for (var i = 0; i < windowClients.length; i++) {
            var client = windowClients[i];
            if (client.url === link && 'focus' in client) {
                return client.focus();
            }
        }
        if (clients.openWindow) {
            return clients.openWindow(link);
        }
    })
  );
});
