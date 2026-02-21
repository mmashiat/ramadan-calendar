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

function timeToMinutes(timeStr: string): number {
  const clean = timeStr.replace(/\s*\(.*\)/, '').trim();
  const [h, m] = clean.split(':').map(Number);
  return h * 60 + m;
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

    const imsakStr = timings.Imsak?.replace(/\s*\(.*\)/, '') || '';
    const fajrStr = timings.Fajr?.replace(/\s*\(.*\)/, '') || '';
    const maghribStr = timings.Maghrib?.replace(/\s*\(.*\)/, '') || '';

    // Compute day progress (0-1 over 24h)
    const nowMin = today.getHours() * 60 + today.getMinutes();
    const dayProgress = nowMin / 1440;
    const fajrFraction = timeToMinutes(fajrStr) / 1440;
    const maghribFraction = timeToMinutes(maghribStr) / 1440;
    const imsakFraction = timeToMinutes(imsakStr) / 1440;

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.json({
      ramadanDay: getRamadanDay(),
      totalDays: RAMADAN_DAYS,
      daysUntilEid: getDaysUntilEid(),
      imsak: imsakStr,
      fajr: fajrStr,
      maghrib: maghribStr,
      dayProgress,
      fajrFraction,
      maghribFraction,
      imsakFraction,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch prayer times' });
  }
}
