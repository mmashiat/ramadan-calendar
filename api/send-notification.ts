import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Receiver } from '@upstash/qstash';
import webpush from 'web-push';
import { scheduleNotificationsForSubscriber, getRedis, getQStash } from './_lib/schedule.js';

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify QStash signature
  const signature = req.headers['upstash-signature'] as string;
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  try {
    const appUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

    await receiver.verify({
      signature,
      body,
      url: `${appUrl}/api/send-notification`,
    });
  } catch {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { redisKey, title, body: notifBody, tag, chainNext } = req.body;

  const redis = getRedis();
  const raw = await redis.get<string>(redisKey);
  if (!raw) {
    // Subscription no longer exists
    await redis.srem('push:subscribers', redisKey);
    return res.status(200).json({ ok: true, skipped: 'no subscription' });
  }

  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const { subscription, lat, lng } = data as {
    subscription: webpush.PushSubscription;
    lat: number;
    lng: number;
  };

  // Configure VAPID
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body: notifBody, tag, icon: '/icons/icon-192.png' }),
    );
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 410 || statusCode === 404) {
      // Subscription expired or invalid — clean up
      await redis.del(redisKey);
      await redis.srem('push:subscribers', redisKey);
      return res.status(200).json({ ok: true, removed: true });
    }
    console.error('web-push error:', err);
    return res.status(500).json({ error: 'Failed to send notification' });
  }

  // After maghrib notification: schedule tomorrow's notifications (chain)
  if (chainNext) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    try {
      const qstash = getQStash();
      await scheduleNotificationsForSubscriber(redisKey, { lat, lng }, qstash, tomorrow);
    } catch (err) {
      console.error('Failed to chain next day schedule:', err);
    }
  }

  return res.status(200).json({ ok: true, sent: true });
}
