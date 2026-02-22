import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scheduleNotificationsForSubscriber, getRedis, getQStash } from '../_lib/schedule';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const redis = getRedis();
  const qstash = getQStash();
  const today = new Date();

  // Get all subscriber keys
  const keys = await redis.smembers('push:subscribers');

  let scheduled = 0;
  let removed = 0;
  let errors = 0;

  for (const key of keys) {
    const raw = await redis.get<string>(key);
    if (!raw) {
      // Dead key — remove from set
      await redis.srem('push:subscribers', key);
      removed++;
      continue;
    }

    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const { lat, lng } = data as { lat: number; lng: number };

    try {
      await scheduleNotificationsForSubscriber(key, { lat, lng }, qstash, today);
      scheduled++;
    } catch (err) {
      console.error(`Failed to schedule for ${key}:`, err);
      errors++;
    }
  }

  return res.status(200).json({ ok: true, scheduled, removed, errors, total: keys.length });
}
