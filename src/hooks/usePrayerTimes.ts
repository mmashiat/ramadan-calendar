import { useState, useEffect } from 'react';
import { RAMADAN_DAYS, getRamadanDate } from '../lib/ramadan';
import {
  getCachedPrayerTimes,
  cachePrayerTimes,
  type DayPrayerTimes,
} from '../lib/storage';

interface PrayerTimesState {
  times: Record<number, DayPrayerTimes>;
  loading: boolean;
  error: string | null;
}

export function usePrayerTimes(lat: number, lng: number, locationReady: boolean): PrayerTimesState {
  const [state, setState] = useState<PrayerTimesState>(() => {
    const cached = getCachedPrayerTimes();
    if (cached && Object.keys(cached).length > 0 && cached[1]?.imsak) {
      return { times: cached, loading: false, error: null };
    }
    return { times: {}, loading: true, error: null };
  });

  useEffect(() => {
    if (!locationReady || lat === 0) return;

    const cached = getCachedPrayerTimes();
    if (cached && Object.keys(cached).length === RAMADAN_DAYS && cached[1]?.imsak) {
      setState({ times: cached, loading: false, error: null });
      return;
    }

    async function fetchAllDays() {
      try {
        const times: Record<number, DayPrayerTimes> = {};

        // Fetch prayer times for the whole month using Aladhan calendar API
        const date = getRamadanDate(1);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        const res = await fetch(
          `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=2`
        );
        const data = await res.json();

        if (data.code !== 200 || !data.data) {
          throw new Error('Failed to fetch prayer times');
        }

        // Also fetch March if Ramadan spans two months
        const date30 = getRamadanDate(30);
        let marchData: any[] = [];
        if (date30.getMonth() + 1 !== month) {
          const res2 = await fetch(
            `https://api.aladhan.com/v1/calendar/${date30.getFullYear()}/${date30.getMonth() + 1}?latitude=${lat}&longitude=${lng}&method=2`
          );
          const data2 = await res2.json();
          if (data2.code === 200 && data2.data) {
            marchData = data2.data;
          }
        }

        const allDays = [...data.data, ...marchData];

        for (let day = 1; day <= RAMADAN_DAYS; day++) {
          const ramadanDate = getRamadanDate(day);
          const dayOfMonth = ramadanDate.getDate();
          const monthIdx = ramadanDate.getMonth() + 1;

          // Find matching day in API response
          const apiDay = allDays.find((d: any) => {
            const g = d.date.gregorian;
            return parseInt(g.day) === dayOfMonth && parseInt(g.month.number) === monthIdx;
          });

          if (apiDay) {
            const t = apiDay.timings;
            times[day] = {
              fajr: cleanTime(t.Fajr),
              imsak: cleanTime(t.Imsak),
              sunrise: cleanTime(t.Sunrise),
              dhuhr: cleanTime(t.Dhuhr),
              asr: cleanTime(t.Asr),
              maghrib: cleanTime(t.Maghrib),
              isha: cleanTime(t.Isha),
            };
          }
        }

        cachePrayerTimes(times);
        setState({ times, loading: false, error: null });
      } catch (err) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load prayer times',
        }));
      }
    }

    fetchAllDays();
  }, [lat, lng, locationReady]);

  return state;
}

// Aladhan returns times like "05:23 (EST)" — strip the timezone part
function cleanTime(time: string): string {
  return time.replace(/\s*\(.*\)/, '').trim();
}
