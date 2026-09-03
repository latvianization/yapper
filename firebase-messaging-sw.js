// Firebase Cloud Messaging Service Worker for background push notifications
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCz5BCrd2FE2C7ndj2h2DsMnL5CxcuoFHw",
  authDomain: "yapper-chat.firebaseapp.com",
  projectId: "yapper-chat",
  storageBucket: "yapper-chat.firebasestorage.app",
  messagingSenderId: "623617699938",
  appId: "1:623617699938:web:e0f44ce31ba1987afaa13b"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  const notificationTitle = payload.notification?.title || 'New message on Yapper';
  const notificationOptions = {
    body: payload.notification?.body || 'You received a new message',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-192.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
