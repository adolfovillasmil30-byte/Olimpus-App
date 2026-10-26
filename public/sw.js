// Service Worker for Olimpus - Background Notifications & Timer Alarms
const CACHE_NAME = 'olimpus-sw-v1';

let timerTimeoutId = null;
let gymReminderTimeoutId = null;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming messages from the app
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  // Schedule Rest Timer Completion Notification
  if (data.type === 'SCHEDULE_TIMER_DONE') {
    if (timerTimeoutId) {
      clearTimeout(timerTimeoutId);
      timerTimeoutId = null;
    }

    const delayMs = Math.max(0, data.triggerAt - Date.now());

    timerTimeoutId = setTimeout(() => {
      self.registration.showNotification('⏱️ ¡Descanso Terminado!', {
        body: data.exerciseName
          ? `¡Tiempo cumplido para ${data.exerciseName}! A por la siguiente serie 🔥`
          : '¡Tiempo cumplido! Hora de darle con todo a la siguiente serie 🔥',
        icon: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=192&q=80',
        badge: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=192&q=80',
        vibrate: [300, 150, 300, 150, 500],
        tag: 'rest-timer-finished',
        renotify: true,
        requireInteraction: true,
      });
      timerTimeoutId = null;
    }, delayMs);
  }

  // Cancel Rest Timer
  if (data.type === 'CANCEL_TIMER') {
    if (timerTimeoutId) {
      clearTimeout(timerTimeoutId);
      timerTimeoutId = null;
    }
  }

  // Schedule Gym Daily Reminder
  if (data.type === 'SCHEDULE_GYM_REMINDER') {
    if (gymReminderTimeoutId) {
      clearTimeout(gymReminderTimeoutId);
      gymReminderTimeoutId = null;
    }

    const delayMs = Math.max(0, data.triggerAt - Date.now());

    gymReminderTimeoutId = setTimeout(() => {
      self.registration.showNotification(data.title || '¡Vamos al Gym! 💪', {
        body: data.body || 'Hoy toca darlo todo. ¡Mantén tu disciplina en Olimpus!',
        icon: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=192&q=80',
        badge: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=192&q=80',
        vibrate: [250, 150, 250, 150, 400],
        tag: 'olimpus-gym-reminder',
        renotify: true,
      });
      gymReminderTimeoutId = null;
    }, delayMs);
  }

  // Immediate Notification Request
  if (data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=192&q=80',
      badge: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=192&q=80',
      vibrate: [200, 100, 200],
      tag: data.tag || 'olimpus-alert',
      renotify: true,
    });
  }
});

// When user clicks the notification, focus or open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
