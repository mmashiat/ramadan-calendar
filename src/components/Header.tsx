import { RAMADAN_YEAR_AH } from '../lib/ramadan';
import { TimeDisplay } from './ui/TimeDisplay';
import type { DayPrayerTimes } from '../lib/storage';

interface HeaderProps {
  locationError?: string | null;
  todayPrayerTimes?: DayPrayerTimes;
}

export function Header({ locationError, todayPrayerTimes }: HeaderProps) {
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="text-center mb-4">
      <h1 className="text-[15px] font-medium text-white/85 tracking-wide">
        {dateStr}
      </h1>
      <p className="text-[10px] text-white/30 mt-0.5 tracking-[0.2em] uppercase">
        Ramadan {RAMADAN_YEAR_AH}
      </p>

      {todayPrayerTimes && (
        <div className="flex justify-center items-center gap-6 mt-3 pt-3 border-t border-white/[0.06]">
          <TimeDisplay label="Suhoor" time={todayPrayerTimes.fajr} />
          <div className="w-px h-8 bg-white/[0.06]" />
          <TimeDisplay label="Iftar" time={todayPrayerTimes.maghrib} />
        </div>
      )}

      {locationError && (
        <p className="text-[8px] text-amber-500/40 mt-1">{locationError}</p>
      )}
    </div>
  );
}
