import { useEffect, useRef, useCallback, useState } from 'react';
import type { DayPrayerTimes } from '../lib/storage';

const NOTIFICATION_STORAGE_KEY = 'ramadan-notifications-enabled';
const LEAD_TIME_MS = 10 * 60 * 1000; // 10 minutes

function parseTimeToday(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
}

async function showNotification(title: string, body: string, tag: string): Promise<void> {
  const options: NotificationOptions = {
    body,
    tag,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    silent: false,
  };

  try {
    const registration = await navigator.serviceWorker?.ready;
    if (registration) {
      await registration.showNotification(title, options);
      return;
    }
  } catch {
    // Fall through to Notification API
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options);
  }
}

type PermState = 'default' | 'granted' | 'denied' | 'unsupported';

export function useNotifications(todayTimes: DayPrayerTimes | undefined) {
  const imsakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iftarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [permissionState, setPermissionState] = useState<PermState>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission as PermState;
  });
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(NOTIFICATION_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const isSupported = permissionState !== 'unsupported';
  const isGranted = permissionState === 'granted';
  const isDenied = permissionState === 'denied';

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      setPermissionState('unsupported');
      return false;
    }
    try {
      const result = await Notification.requestPermission();
      setPermissionState(result as PermState);
      if (result === 'granted') {
        setEnabled(true);
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'true');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const toggleNotifications = useCallback(async (): Promise<void> => {
    if (!isGranted) {
      await requestPermission();
      return;
    }
    const newState = !enabled;
    setEnabled(newState);
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, String(newState));
  }, [isGranted, enabled, requestPermission]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (imsakTimerRef.current) clearTimeout(imsakTimerRef.current);
      if (iftarTimerRef.current) clearTimeout(iftarTimerRef.current);
    };
  }, []);

  // Schedule notifications
  useEffect(() => {
    if (imsakTimerRef.current) {
      clearTimeout(imsakTimerRef.current);
      imsakTimerRef.current = null;
    }
    if (iftarTimerRef.current) {
      clearTimeout(iftarTimerRef.current);
      iftarTimerRef.current = null;
    }

    if (!todayTimes || !enabled || !isGranted) return;

    const now = Date.now();

    const imsakNotifyAt = parseTimeToday(todayTimes.imsak).getTime() - LEAD_TIME_MS;
    const imsakDelay = imsakNotifyAt - now;
    if (imsakDelay > 0) {
      imsakTimerRef.current = setTimeout(() => {
        showNotification('Imsak in 10 minutes', 'Time to prepare for suhoor', `imsak-${new Date().toDateString()}`);
      }, imsakDelay);
    }

    const iftarNotifyAt = parseTimeToday(todayTimes.maghrib).getTime() - LEAD_TIME_MS;
    const iftarDelay = iftarNotifyAt - now;
    if (iftarDelay > 0) {
      iftarTimerRef.current = setTimeout(() => {
        showNotification('Iftar in 10 minutes', 'Almost time to break your fast', `iftar-${new Date().toDateString()}`);
      }, iftarDelay);
    }
  }, [todayTimes, enabled, isGranted]);

  // Re-schedule at midnight
  useEffect(() => {
    if (!enabled || !isGranted) return;

    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 30);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimer = setTimeout(() => {
      setEnabled(prev => prev);
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, [enabled, isGranted]);

  return { isSupported, isGranted, isDenied, enabled, toggleNotifications };
}
