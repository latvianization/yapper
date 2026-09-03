// Firebase Cloud Messaging Service Worker for intelligent push notifications
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

/**
 * Checks if the user is currently focused and seeing the specific chat channel.
 */
async function isUserSeeingChat(channelId) {
  if (!channelId) return false;
  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  
  for (const client of clientList) {
    // If the window is focused and visible
    if (client.focused && client.visibilityState === 'visible') {
      // Check if client is currently on this channel
      const url = new URL(client.url);
      const activeChannelParam = url.searchParams.get('channel');
      if (activeChannelParam === channelId || url.hash.includes(channelId)) {
        return true;
      }
    }
  }
  return false;
}

messaging.onBackgroundMessage(async (payload) => {
  console.log('[firebase-messaging-sw.js] Received push message payload:', payload);

  const data = payload.data || {};
  const channelId = data.channelId || '';
  const channelName = data.channelName || 'general';
  const senderName = data.senderName || 'Teammate';

  // Rule: If user sees chat with new message, then NO push notification
  const isSeeing = await isUserSeeingChat(channelId);
  if (isSeeing) {
    console.log(`[firebase-messaging-sw.js] User is actively seeing chat #${channelName}. Push notification suppressed.`);
    return;
  }

  // Else: push to browser notification center
  const notificationTitle = payload.notification?.title || `#${channelName} • ${senderName}`;
  const notificationOptions = {
    body: payload.notification?.body || data.text || 'You received a new message',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-192.png',
    tag: `channel-${channelId}`, // Replaces older notification for same channel to avoid clutter
    renotify: true,
    data: {
      channelId: channelId,
      url: `/?channel=${channelId}`
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click: focus existing window or open to channel
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const channelId = event.notification.data?.channelId;
  const targetUrl = channelId ? `/?channel=${encodeURIComponent(channelId)}` : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NAVIGATE_CHANNEL',
            channelId: channelId
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
