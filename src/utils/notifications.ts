// Reworked Notification & Background Timing Utilities for Olimpus
import { playTimerLoudBeep } from './audio';

const NOTIF_SETTINGS_KEY = 'olimpus_notif_settings';
const LAST_GYM_NOTIF_KEY = 'olimpus_last_gym_notified_date';

export interface NotificationSettings {
  enabled: boolean;
  gymReminderTime: string; // e.g. "18:00"
  streakReminderEnabled: boolean;
  motivationalEnabled: boolean;
  timerNotificationsEnabled: boolean;
}

export const DEFAULT_NOTIF_SETTINGS: NotificationSettings = {
  enabled: false,
  gymReminderTime: '18:00',
  streakReminderEnabled: true,
  motivationalEnabled: true,
  timerNotificationsEnabled: true,
};

export const MOTIVATIONAL_MESSAGES = [
  {
    title: '¡Vamos al Gym! 💪',
    body: 'Hoy toca darlo todo. ¡La disciplina de hoy es tu orgullo de mañana!',
  },
  {
    title: '🔥 ¡No pierdas tu racha en Olimpus!',
    body: 'Mantén la llama encendida registrando tu entrenamiento de hoy.',
  },
  {
    title: '🎯 Cada día más cerca del objetivo',
    body: 'La consistencia supera al talento. ¡Haz que este día cuente!',
  },
  {
    title: '⚡ ¡Es hora de entrenar!',
    body: 'El único mal entrenamiento es el que no se hace. ¡A por ello!',
  },
];

// Register Service Worker for lockscreen & background reliability
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (err) {
    console.debug('Service worker registration failed:', err);
    return null;
  }
}

// Check notification support
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

// Request permission and immediately register service worker
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    if (granted) {
      await registerServiceWorker();
      saveNotifSettings({ ...loadNotifSettings(), enabled: true });
      syncScheduledGymReminder();
    }
    return granted;
  } catch (e) {
    console.error('Error requesting notification permission', e);
    return false;
  }
}

interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[];
  renotify?: boolean;
}

// Send standard push/local notification via ServiceWorker or Window Notification
export function sendLocalNotification(title: string, options?: ExtendedNotificationOptions): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const defaultIcon =
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=192&q=80';

  try {
    // Prefer Service Worker registration for lockscreen / Android shade visibility
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          icon: defaultIcon,
          badge: defaultIcon,
          vibrate: [250, 150, 250, 150, 400],
          ...options,
        });
      });
      return true;
    }

    // Fallback to Window Notification
    const notif = new Notification(title, {
      icon: defaultIcon,
      badge: defaultIcon,
      ...options,
    });

    setTimeout(() => notif.close(), 8000);
    return true;
  } catch (err) {
    console.warn('Could not display notification', err);
    return false;
  }
}

// Send motivational notification
export function sendMotivationalNotification(type?: 'gym' | 'streak' | 'goal') {
  if (type === 'gym') {
    sendLocalNotification('¡Vamos al Gym! 💪', {
      body: 'Hoy toca darlo todo. ¡La disciplina de hoy es tu orgullo de mañana!',
      tag: 'olimpus-gym-reminder',
    });
    return;
  }
  if (type === 'streak') {
    sendLocalNotification('🔥 ¡No pierdas tu racha!', {
      body: 'Estás a solo una sesión de mantener tu fuego encendido en Olimpus.',
      tag: 'olimpus-streak-alert',
    });
    return;
  }
  if (type === 'goal') {
    sendLocalNotification('🎯 Cada día más cerca del objetivo', {
      body: 'Un entrenamiento más cerca de tu meta física. ¡No te rindas!',
      tag: 'olimpus-goal-reminder',
    });
    return;
  }

  const randomItem = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
  sendLocalNotification(randomItem.title, {
    body: randomItem.body,
    tag: 'olimpus-motivation',
  });
}

// ==========================================
// ⏱️ TEMPORIZADOR: Notificación ÚNICA al terminar
// (Sin spamear notificaciones durante la cuenta)
// ==========================================

// Programa en el Service Worker la notificación final exacta para cuando el descanso termine
export function scheduleTimerDoneInWorker(triggerAt: number, exerciseName?: string) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.ready.then((reg) => {
    if (reg.active) {
      reg.active.postMessage({
        type: 'SCHEDULE_TIMER_DONE',
        triggerAt,
        exerciseName,
      });
    }
  });
}

// Cancela la alarma del temporizador en el Service Worker si el usuario pausa/reinicia
export function cancelTimerDoneInWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.ready.then((reg) => {
    if (reg.active) {
      reg.active.postMessage({
        type: 'CANCEL_TIMER',
      });
    }
  });
}

// Dispara UNA ÚNICA NOTIFICACIÓN con pitido fuerte y vibración al terminar el descanso
export function sendTimerCompletedNotification(exerciseName?: string) {
  // 1. Emitir pitido de aviso del teléfono
  playTimerLoudBeep();

  // 2. Enviar la única notificación de descanso finalizado
  const bodyText = exerciseName
    ? `Descanso finalizado para "${exerciseName}". ¡A por la siguiente serie!`
    : '¡Tiempo cumplido! Hora de romperla en la siguiente serie 🔥';

  sendLocalNotification('⏱️ ¡Descanso Terminado!', {
    body: bodyText,
    tag: 'rest-timer-finished',
    renotify: true,
    requireInteraction: true,
  });
}

// ==========================================
// 🔔 RECORDATORIO PROGRAMADO DE GYM (Hora específica)
// ==========================================

// Sincroniza la hora programada en el Service Worker para que avise aunque la app esté cerrada
export function syncScheduledGymReminder(settings?: NotificationSettings) {
  const currentSettings = settings || loadNotifSettings();
  if (!currentSettings.enabled || !currentSettings.gymReminderTime) return;

  const [hours, minutes] = currentSettings.gymReminderTime.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return;

  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  // Si la hora de hoy ya pasó, programar para mañana
  if (scheduledTime.getTime() <= now.getTime()) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const triggerAt = scheduledTime.getTime();

  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.active) {
        reg.active.postMessage({
          type: 'SCHEDULE_GYM_REMINDER',
          triggerAt,
          title: '¡Vamos al Gym! 💪',
          body: 'Es tu hora programada para entrenar. ¡Mantén tu disciplina en Olimpus!',
        });
      }
    });
  }
}

// Verifica periódicamente en la app en primer/segundo plano si ya es la hora del recordatorio
export function checkAndTriggerScheduledReminders() {
  const settings = loadNotifSettings();
  if (!settings.enabled || !settings.gymReminderTime) return;

  const now = new Date();
  const currentHH = String(now.getHours()).padStart(2, '0');
  const currentMM = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHH}:${currentMM}`;

  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const lastNotifiedDate = localStorage.getItem(LAST_GYM_NOTIF_KEY);

  if (currentTimeStr === settings.gymReminderTime && lastNotifiedDate !== todayDateStr) {
    localStorage.setItem(LAST_GYM_NOTIF_KEY, todayDateStr);
    sendLocalNotification('¡Vamos al Gym! 💪', {
      body: 'Es tu hora programada para entrenar. ¡Hoy toca superarse en Olimpus!',
      tag: 'olimpus-gym-reminder-scheduled',
      renotify: true,
      requireInteraction: true,
    });
    // Programar el siguiente recordatorio
    syncScheduledGymReminder(settings);
  }
}

// Storage helpers
export function loadNotifSettings(uid?: string): NotificationSettings {
  try {
    const key = uid ? `olimpus_${uid}_notif_settings` : NOTIF_SETTINGS_KEY;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading notification settings', e);
  }
  return DEFAULT_NOTIF_SETTINGS;
}

export function saveNotifSettings(settings: NotificationSettings, uid?: string) {
  try {
    const key = uid ? `olimpus_${uid}_notif_settings` : NOTIF_SETTINGS_KEY;
    localStorage.setItem(key, JSON.stringify(settings));
    syncScheduledGymReminder(settings);
  } catch (e) {
    console.warn('Error saving notification settings', e);
  }
}

