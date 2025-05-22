// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyBXvt3ICqKMulzklVfPBw_SFIVdSlb8hTw",
  authDomain: "groovy-student-419204.firebaseapp.com",
  projectId: "groovy-student-419204",
  messagingSenderId: "990650286607",
  appId: "1:990650286607:web:99320bbd23b96b8e4c997a",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification.title; 
  const notificationOptions = {
  body: payload.notification.body + " " + payload.data.createdAt,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const data = event.notification.data;
  console.log('Notification data:', data);
  event.waitUntil(
    // Open a specific URL when the notification is clicked
    clients.openWindow('/notifcation')
  );
});