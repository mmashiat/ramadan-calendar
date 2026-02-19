# Ramadan Calendar 1447

A minimal, beautiful Ramadan fasting tracker. 30 circles. Each one lives and breathes with the sun.

![Dark themed Ramadan calendar widget](https://img.shields.io/badge/Ramadan-1447_AH-F59E0B?style=for-the-badge&labelColor=0A0A0A)

## How it works

- **30 circles** in a compact grid — one for each day of Ramadan
- **Today's circle** glows amber at Fajr, peaks at noon, shifts to sunset red at Maghrib, and goes dark after Isha
- **After Isha**, tap the circle to log whether you completed your fast
- **Green** = fasted. **Red** = missed. **Dark** = not yet logged.
- Prayer times are auto-calculated based on your location

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/ramadan-calendar)

Or run locally:

```bash
git clone https://github.com/YOUR_USERNAME/ramadan-calendar.git
cd ramadan-calendar
npm install
npm run dev
```

## Add to iPhone Home Screen

1. Open your deployed URL in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. It runs as a standalone app — no browser chrome

## Privacy

- **No backend. No accounts. No tracking.**
- All data stays in your browser's localStorage
- Prayer times are fetched from [Aladhan API](https://aladhan.com/prayer-times-api) (free, no auth)
- Location is requested once and cached locally

## Tech

- Vite + React + TypeScript
- Tailwind CSS
- Aladhan Prayer Times API
- PWA (installable, works offline)
- ~200KB total bundle

## Ramadan 2026 Dates

- **Start:** February 18, 2026 (1 Ramadan 1447 AH)
- **End:** March 19, 2026 (30 Ramadan 1447 AH)

---

Built with love for the ummah.
