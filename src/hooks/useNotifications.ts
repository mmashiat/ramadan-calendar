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

function getPermState(): 'default' | 'granted' | 'denied' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as 'default' | 'granted' | 'denied';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush(lat: number, lng: number): Promise<void> {
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) return;

  try {
    const registration = await navigator.serviceWorker?.ready;
    if (!registration?.pushManager) return;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });
    }

    // Send subscription to server
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        lat,
        lng,
      }),
    });
  } catch (err) {
    console.error('Failed to subscribe to push:', err);
  }
}

async function unsubscribeFromPush(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker?.ready;
    if (!registration?.pushManager) return;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    // Tell server to remove subscription
    await fetch('/api/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    await subscription.unsubscribe();
  } catch (err) {
    console.error('Failed to unsubscribe from push:', err);
  }
}

export function useNotifications(
  todayTimes: DayPrayerTimes | undefined,
  lat?: number,
  lng?: number,
) {
  const imsakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iftarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [permissionState, setPermissionState] = useState(getPermState);
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(NOTIFICATION_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  // Show settings hint when user taps while denied
  const [showSettingsHint, setShowSettingsHint] = useState(false);
  // Track last lat/lng we subscribed with
  const lastPushCoordsRef = useRef<string | null>(null);

  const isSupported = permissionState !== 'unsupported';
  const isGranted = permissionState === 'granted';
  const isDenied = permissionState === 'denied';

  // Poll for permission changes (user may grant/revoke in browser settings)
  useEffect(() => {
    if (!isSupported) return;
    const interval = setInterval(() => {
      const current = getPermState();
      setPermissionState(prev => {
        if (prev !== current) {
          // If permission was just granted externally, auto-enable
          if (current === 'granted' && prev === 'denied') {
            setEnabled(true);
            localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'true');
            setShowSettingsHint(false);
          }
          return current;
        }
        return prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      setPermissionState('unsupported');
      return false;
    }
    try {
      const result = await Notification.requestPermission();
      setPermissionState(result as typeof permissionState);
      if (result === 'granted') {
        setEnabled(true);
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'true');
        setShowSettingsHint(false);
        return true;
      }
      if (result === 'denied') {
        setShowSettingsHint(true);
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const toggleNotifications = useCallback(async (): Promise<void> => {
    // Re-check permission in case user changed it in settings
    const current = getPermState();
    setPermissionState(current);

    if (current === 'denied') {
      // Show hint to go to settings — toggle the hint on each tap
      setShowSettingsHint(prev => !prev);
      return;
    }

    if (current === 'default') {
      // Haven't asked yet — request permission
      await requestPermission();
      return;
    }

    // Permission is granted — toggle on/off freely
    const newState = !enabled;
    setEnabled(newState);
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, String(newState));

    // Handle Web Push subscription
    if (!newState) {
      unsubscribeFromPush();
      lastPushCoordsRef.current = null;
    }
  }, [enabled, requestPermission]);

  const dismissSettingsHint = useCallback(() => {
    setShowSettingsHint(false);
  }, []);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (imsakTimerRef.current) clearTimeout(imsakTimerRef.current);
      if (iftarTimerRef.current) clearTimeout(iftarTimerRef.current);
    };
  }, []);

  // Web Push subscription: subscribe/resubscribe when enabled + granted + coords available
  useEffect(() => {
    if (!enabled || !isGranted || lat == null || lng == null || lat === 0) return;

    const coordsKey = `${lat},${lng}`;
    if (lastPushCoordsRef.current === coordsKey) return;

    // If we had a previous subscription with different coords, unsubscribe first
    if (lastPushCoordsRef.current !== null) {
      unsubscribeFromPush().then(() => subscribeToPush(lat, lng));
    } else {
      subscribeToPush(lat, lng);
    }
    lastPushCoordsRef.current = coordsKey;
  }, [enabled, isGranted, lat, lng]);

  // Schedule client-side notifications (fallback)
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

  return {
    isSupported,
    isGranted,
    isDenied,
    enabled,
    showSettingsHint,
    toggleNotifications,
    dismissSettingsHint,
  };
}
