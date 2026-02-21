import type { VercelRequest, VercelResponse } from '@vercel/node';

const RAMADAN_START = new Date(2026, 1, 18); // Feb 18, 2026
const RAMADAN_DAYS = 30;
const EID_DATE = new Date(2026, 2, 20); // Mar 20, 2026

function getRamadanDay(): number {
  const now = new Date();
  const diffMs = now.getTime() - RAMADAN_START.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(RAMADAN_DAYS, diffDays));
}

function getDaysUntilEid(): number {
  const now = new Date();
  const diffMs = EID_DATE.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const lat = parseFloat(req.query.lat as string) || 40.7128;
  const lng = parseFloat(req.query.lng as string) || -74.006;

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const day = today.getDate();

  try {
    const url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${lat}&longitude=${lng}&method=2`;
    const response = await fetch(url);
    const data = await response.json();
    const timings = data.data.timings;

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    res.json({
      ramadanDay: getRamadanDay(),
      totalDays: RAMADAN_DAYS,
      daysUntilEid: getDaysUntilEid(),
      imsak: timings.Imsak?.replace(/\s*\(.*\)/, '') || '',
      fajr: timings.Fajr?.replace(/\s*\(.*\)/, '') || '',
      maghrib: timings.Maghrib?.replace(/\s*\(.*\)/, '') || '',
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch prayer times' });
  }
}
