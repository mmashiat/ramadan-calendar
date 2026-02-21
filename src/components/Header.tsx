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
    <div className="text-center mb-8 pb-6 border-b border-white/[0.06]">
      <h1 className="text-[17px] font-medium text-white/90 tracking-wide">
        {dateStr}
      </h1>
      <p className="text-[10px] text-white/30 mt-1 tracking-[0.2em] uppercase">
        Ramadan {RAMADAN_YEAR_AH}
      </p>

      {todayPrayerTimes && (
        <div className="flex justify-center items-center gap-5 mt-5 pt-5 border-t border-white/[0.08]">
          <TimeDisplay label="Imsak" time={todayPrayerTimes.imsak} />
          <div className="w-px h-8 bg-white/[0.08]" />
          <TimeDisplay label="Suhoor" time={todayPrayerTimes.fajr} />
          <div className="w-px h-8 bg-white/[0.08]" />
          <TimeDisplay label="Iftar" time={todayPrayerTimes.maghrib} />
        </div>
      )}

      {locationError && (
        <p className="text-[8px] text-amber-500/40 mt-2">{locationError}</p>
      )}
    </div>
  );
}
