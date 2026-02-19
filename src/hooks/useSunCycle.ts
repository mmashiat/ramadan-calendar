import { useState, useEffect, useRef } from 'react';
import type { DayPrayerTimes } from '../lib/storage';

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Sun progress states:
// -1 = before fajr (night)
//  0-1 = fajr to maghrib (the fasting window - sun cycle)
//  2 = after maghrib, before midnight (prompt to log)
//  3 = after midnight / post-isha (logged or waiting for next day)
export function useSunCycle(prayerTimes: DayPrayerTimes | undefined): number {
  const [progress, setProgress] = useState(-1);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!prayerTimes) {
      setProgress(-1);
      return;
    }

    const fajrMin = timeToMinutes(prayerTimes.fajr);
    const maghribMin = timeToMinutes(prayerTimes.maghrib);
    const ishaMin = timeToMinutes(prayerTimes.isha);
    const totalSpan = maghribMin - fajrMin; // Fasting window: fajr to maghrib

    function update() {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

      if (currentMin < fajrMin) {
        setProgress(-1); // Before fajr — night
      } else if (currentMin <= maghribMin) {
        // During the fast: fajr to maghrib = 0 to 1
        const p = (currentMin - fajrMin) / totalSpan;
        setProgress(Math.max(0, Math.min(1, p)));
      } else if (currentMin <= ishaMin + 120) {
        // After maghrib — prompt window (2 hours after isha)
        setProgress(2);
      } else {
        setProgress(3); // Late night
      }

      rafRef.current = requestAnimationFrame(update);
    }

    update();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [prayerTimes]);

  return progress;
}
