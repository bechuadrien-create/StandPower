import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { DayOfWeek, Reminder } from '../../domain/types';

const DAY_TO_CAPACITOR_WEEKDAY: Record<DayOfWeek, number> = {
  sun: 1,
  mon: 2,
  tue: 3,
  wed: 4,
  thu: 5,
  fri: 6,
  sat: 7,
};

function hashReminderId(reminderId: string, day: DayOfWeek): number {
  const combined = `${reminderId}_${day}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31 + combined.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 1000000) + 100;
}

export function isTimeWithinQuietHours(
  localTime: string,
  quietStart: string,
  quietEnd: string
): boolean {
  if (!localTime || !quietStart || !quietEnd) return false;
  if (quietStart <= quietEnd) {
    return localTime >= quietStart && localTime <= quietEnd;
  }
  // Plage chevauchant minuit (ex: 22:00 -> 07:30)
  return localTime >= quietStart || localTime <= quietEnd;
}

export async function checkNotificationPermissionStatus(): Promise<
  'granted' | 'denied' | 'prompt'
> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') return 'granted';
      if (status.display === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'denied';
    }
  }

  if (typeof Notification !== 'undefined') {
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return 'prompt';
  }
  return 'denied';
}

export async function requestNotificationPermissionIfNeeded(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const current = await LocalNotifications.checkPermissions();
      if (current.display === 'granted') return true;
      const requested = await LocalNotifications.requestPermissions();
      return requested.display === 'granted';
    } catch {
      return false;
    }
  }

  if (typeof Notification !== 'undefined') {
    try {
      if (Notification.permission === 'granted') return true;
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Reprogramme proprement tous les rappels locaux actifs sans créer de doublons
 * et en respectant les créneaux silencieux.
 */
export async function syncLocalReminders(
  reminders: Reminder[],
  quietHoursStart: string,
  quietHoursEnd: string
): Promise<{ scheduledCount: number; skippedQuietHours: number }> {
  let scheduledCount = 0;
  let skippedQuietHours = 0;

  if (!Capacitor.isNativePlatform()) {
    for (const r of reminders) {
      if (!r.enabled) continue;
      if (isTimeWithinQuietHours(r.localTime, quietHoursStart, quietHoursEnd)) {
        skippedQuietHours += 1;
      } else {
        scheduledCount += r.daysOfWeek.length;
      }
    }
    return { scheduledCount, skippedQuietHours };
  }

  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    }

    const toSchedule: {
      id: number;
      title: string;
      body: string;
      schedule: {
        on: { weekday: number; hour: number; minute: number };
        allowWhileIdle: boolean;
      };
    }[] = [];

    for (const r of reminders) {
      if (!r.enabled) continue;
      if (isTimeWithinQuietHours(r.localTime, quietHoursStart, quietHoursEnd)) {
        skippedQuietHours += 1;
        continue;
      }

      const [hourStr, minStr] = r.localTime.split(':');
      const hour = Number(hourStr);
      const minute = Number(minStr);
      if (!Number.isFinite(hour) || !Number.isFinite(minute)) continue;

      for (const day of r.daysOfWeek) {
        const id = hashReminderId(r.id, day);
        toSchedule.push({
          id,
          title: 'StandPower — Rappel local',
          body: r.title,
          schedule: {
            on: {
              weekday: DAY_TO_CAPACITOR_WEEKDAY[day],
              hour,
              minute,
            },
            allowWhileIdle: false,
          },
        });
        scheduledCount += 1;
      }
    }

    if (toSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: toSchedule });
    }
  } catch {
    // Fonctionnement normal conservé même si les notifications natives sont bloquées par l'OS
  }

  return { scheduledCount, skippedQuietHours };
}
