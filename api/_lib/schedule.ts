import { Redis } from '@upstash/redis';
import { Client } from '@upstash/qstash';
import { createHash } from 'crypto';

// Ramadan 2026: Feb 18 - Mar 19
const RAMADAN_START = '2026-02-18';
const RAMADAN_END = '2026-03-19';
const LEAD_MINUTES = 10;

export function hashEndpoint(endpoint: string): string {
  return createHash('sha256').update(endpoint).digest('hex').slice(0, 16);
}

export function prayerTimeToUnix(
  timeStr: string,
  dateStr: string,
  timezone: string,
): number {
  const [hours, minutes] = timeStr.split(':').map(Number);

  // Build a date string in the target timezone and find its UTC equivalent
  // dateStr is "DD-MM-YYYY" from Aladhan
  const [day, month, year] = dateStr.split('-').map(Number);

  // Create a Date object for the given local time
  // We use a binary-search approach with Intl to find the UTC timestamp
  // that corresponds to the desired local time in the given timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Start with a rough guess: treat the local time as UTC
  let guess = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);

  // Iterate to converge on the correct UTC timestamp
  for (let i = 0; i < 5; i++) {
    const parts = formatter.formatToParts(new Date(guess));
    const p: Record<string, number> = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        p[part.type] = parseInt(part.value, 10);
      }
    }
    const localH = p.hour ?? 0;
    const localM = p.minute ?? 0;
    const localD = p.day ?? 0;

    const diffMinutes =
      (hours - localH) * 60 + (minutes - localM) + (day - localD) * 1440;

    if (diffMinutes === 0) break;
    guess += diffMinutes * 60 * 1000;
  }

  return Math.floor(guess / 1000);
}

function isWithinRamadan(dateStr: string): boolean {
  // dateStr is "DD-MM-YYYY" from Aladhan
  const [d, m, y] = dateStr.split('-').map(Number);
  const date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return date >= RAMADAN_START && date <= RAMADAN_END;
}

export async function scheduleNotificationsForSubscriber(
  redisKey: string,
  data: { lat: number; lng: number },
  qstash: Client,
  targetDate: Date,
): Promise<void> {
  const day = targetDate.getDate();
  const month = targetDate.getMonth() + 1;
  const year = targetDate.getFullYear();

  // Fetch prayer times from Aladhan
  const url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${data.lat}&longitude=${data.lng}&method=2`;
  const res = await fetch(url);
  if (!res.ok) return;

  const json = await res.json();
  const timings = json.data.timings;
  const meta = json.data.meta;
  const timezone: string = meta.timezone;
  const dateStr: string = json.data.date.gregorian.date; // "DD-MM-YYYY"

  if (!isWithinRamadan(dateStr)) return;

  const now = Math.floor(Date.now() / 1000);
  const dateLabel = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const appUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

  // Schedule imsak notification (10 min before)
  const imsakTime = timings.Imsak?.replace(/\s*\(.*\)/, '').trim();
  if (imsakTime) {
    const imsakUnix = prayerTimeToUnix(imsakTime, dateStr, timezone) - LEAD_MINUTES * 60;
    if (imsakUnix > now) {
      await qstash.publishJSON({
        url: `${appUrl}/api/send-notification`,
        body: {
          redisKey,
          type: 'imsak',
          date: dateLabel,
          title: 'Imsak in 10 minutes',
          body: 'Time to prepare for suhoor',
          tag: `imsak-${dateLabel}`,
        },
        notBefore: imsakUnix,
      });
    }
  }

  // Schedule maghrib/iftar notification (10 min before)
  const maghribTime = timings.Maghrib?.replace(/\s*\(.*\)/, '').trim();
  if (maghribTime) {
    const maghribUnix = prayerTimeToUnix(maghribTime, dateStr, timezone);
    const iftarAlertUnix = maghribUnix - LEAD_MINUTES * 60;
    if (iftarAlertUnix > now) {
      await qstash.publishJSON({
        url: `${appUrl}/api/send-notification`,
        body: {
          redisKey,
          type: 'maghrib',
          date: dateLabel,
          title: 'Iftar in 10 minutes',
          body: 'Almost time to break your fast',
          tag: `iftar-${dateLabel}`,
          chainNext: true,
        },
        notBefore: iftarAlertUnix,
      });
    }

    // Schedule fasting log reminder (1 hour after maghrib)
    const logReminderUnix = maghribUnix + 60 * 60;
    if (logReminderUnix > now) {
      await qstash.publishJSON({
        url: `${appUrl}/api/send-notification`,
        body: {
          redisKey,
          type: 'log-reminder',
          date: dateLabel,
          title: 'Log your fast',
          body: 'Did you complete your fast today? Tap to record it.',
          tag: `log-${dateLabel}`,
        },
        notBefore: logReminderUnix,
      });
    }
  }
}

export function getRedis(): Redis {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export function getQStash(): Client {
  return new Client({ token: process.env.QSTASH_TOKEN! });
}
