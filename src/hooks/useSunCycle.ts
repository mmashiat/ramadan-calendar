import { useState, useEffect, useRef } from 'react';
import type { DayPrayerTimes } from '../lib/storage';

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Unified day progress: 0-1 over a full 24-hour cycle (midnight to midnight)
// Also returns the fajr/maghrib breakpoints as fractions so the arc and sky know where day/night boundaries are
export interface DayCycleInfo {
  dayProgress: number;    // 0-1 across 24 hours
  fajrFraction: number;   // where fajr falls in the 0-1 range
  maghribFraction: number; // where maghrib falls in the 0-1 range
  imsakFraction: number;   // where imsak falls
  isDay: boolean;          // true if between fajr and maghrib
}

export function useSunCycle(prayerTimes: DayPrayerTimes | undefined): DayCycleInfo {
  const [info, setInfo] = useState<DayCycleInfo>({
    dayProgress: 0,
    fajrFraction: 0.24,
    maghribFraction: 0.76,
    imsakFraction: 0.24,
    isDay: false,
  });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!prayerTimes) {
      setInfo({
        dayProgress: 0,
        fajrFraction: 0.24,
        maghribFraction: 0.76,
        imsakFraction: 0.24,
        isDay: false,
      });
      return;
    }

    const fajrMin = timeToMinutes(prayerTimes.fajr);
    const imsakMin = timeToMinutes(prayerTimes.imsak);
    const maghribMin = timeToMinutes(prayerTimes.maghrib);
    const totalDay = 1440; // 24 * 60

    const fajrFrac = fajrMin / totalDay;
    const imsakFrac = imsakMin / totalDay;
    const maghribFrac = maghribMin / totalDay;

    function update() {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
      const progress = currentMin / totalDay;
      const isDay = currentMin >= fajrMin && currentMin <= maghribMin;

      setInfo({
        dayProgress: Math.max(0, Math.min(1, progress)),
        fajrFraction: fajrFrac,
        maghribFraction: maghribFrac,
        imsakFraction: imsakFrac,
        isDay,
      });

      rafRef.current = requestAnimationFrame(update);
    }

    update();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [prayerTimes]);

  return info;
}
