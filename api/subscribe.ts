import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hashEndpoint, scheduleNotificationsForSubscriber, getRedis, getQStash } from './_lib/schedule';

const TTL_SECONDS = 35 * 24 * 60 * 60; // 35 days

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const { subscription, lat, lng } = req.body;

    if (!subscription?.endpoint || lat == null || lng == null) {
      return res.status(400).json({ error: 'Missing subscription, lat, or lng' });
    }

    const redis = getRedis();
    const key = `push:sub:${hashEndpoint(subscription.endpoint)}`;

    // Store subscription with TTL
    await redis.set(key, JSON.stringify({ subscription, lat, lng }), { ex: TTL_SECONDS });

    // Add to subscribers set for cron enumeration
    await redis.sadd('push:subscribers', key);

    // Schedule today's notifications
    const qstash = getQStash();
    try {
      await scheduleNotificationsForSubscriber(key, { lat, lng }, qstash, new Date());
    } catch {
      // Non-fatal: subscription is stored, scheduling can be retried by cron
    }

    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint' });
    }

    const redis = getRedis();
    const key = `push:sub:${hashEndpoint(endpoint)}`;

    await redis.del(key);
    await redis.srem('push:subscribers', key);

    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
