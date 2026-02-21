import { useState, useCallback, useMemo } from 'react';
import { RAMADAN_DAYS, getRamadanDay } from '../lib/ramadan';
import { getFastingStatus, setFastingStatus, type FastingStatus, type DayPrayerTimes } from '../lib/storage';
import { getMoonPhase } from '../lib/moon';
import { DayCircle } from './DayCircle';
import { FastingPrompt } from './FastingPrompt';
import { SunArc } from './SunArc';

interface RamadanGridProps {
  sunProgress: number;
  todayPrayerTimes?: DayPrayerTimes;
}

function computeStreaks(log: Record<number, FastingStatus>) {
  const streaks = new Map<number, number>();
  let currentStreak = 0;
  let streakStart = -1;

  for (let d = 1; d <= RAMADAN_DAYS; d++) {
    if (log[d] === 'fasted') {
      if (streakStart === -1) streakStart = d;
      currentStreak++;
    } else {
      if (currentStreak > 0) {
        for (let s = streakStart; s < streakStart + currentStreak; s++) {
          streaks.set(s, currentStreak);
        }
      }
      currentStreak = 0;
      streakStart = -1;
    }
  }
  if (currentStreak > 0) {
    for (let s = streakStart; s < streakStart + currentStreak; s++) {
      streaks.set(s, currentStreak);
    }
  }

  return { streaks };
}

export function RamadanGrid({ sunProgress, todayPrayerTimes }: RamadanGridProps) {
  const today = getRamadanDay(new Date());
  const isDaytime = sunProgress >= 0 && sunProgress <= 1;
  const moonPhase = getMoonPhase(today);

  const [fastingLog, setFastingLog] = useState<Record<number, FastingStatus>>(() => {
    const log: Record<number, FastingStatus> = {};
    for (let d = 1; d <= RAMADAN_DAYS; d++) {
      log[d] = getFastingStatus(d);
    }
    return log;
  });

  const [promptDay, setPromptDay] = useState<number | null>(null);

  const handleTap = useCallback((day: number) => {
    setPromptDay(day);
  }, []);

  const handleRecord = useCallback((status: 'fasted' | 'missed') => {
    if (promptDay === null) return;
    setFastingStatus(promptDay, status);
    setFastingLog(prev => ({ ...prev, [promptDay]: status }));
    setPromptDay(null);
  }, [promptDay]);

  const handleClose = useCallback(() => {
    setPromptDay(null);
  }, []);

  const { streaks } = useMemo(() => computeStreaks(fastingLog), [fastingLog]);

  const days = [];
  for (let d = 1; d <= RAMADAN_DAYS; d++) {
    const isToday = d === today;
    const isPast = d < today;
    const isFuture = d > today;
    const streakLength = streaks.get(d) ?? 0;

    days.push(
      <DayCircle
        key={d}
        day={d}
        isToday={isToday}
        isPast={isPast}
        isFuture={isFuture}
        fastingStatus={fastingLog[d]}
        sunProgress={isToday ? sunProgress : isPast ? 2 : -1}
        isInStreak={streakLength >= 2}
        streakLength={streakLength}
        onTap={() => handleTap(d)}
      />
    );
  }

  return (
    <>
      {/* Sun arc during daytime */}
      {isDaytime && todayPrayerTimes && (
        <div className="mb-6">
          <SunArc
            sunProgress={sunProgress}
            fajrTime={todayPrayerTimes.imsak}
            maghribTime={todayPrayerTimes.maghrib}
          />
        </div>
      )}

      {/* Calendar grid with moon background at night */}
      <div className="relative">
        {/* Moon phase background — only at night */}
        {!isDaytime && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <img
              src={moonPhase.image}
              alt={moonPhase.name}
              className="w-[220px] h-[220px] object-contain rounded-full opacity-[0.08]"
              style={{
                filter: 'blur(1px)',
              }}
            />
          </div>
        )}

        <div className="relative z-10 grid grid-cols-6 gap-x-4 gap-y-5 place-items-center px-3">
          {days}
        </div>
      </div>

      {promptDay !== null && (
        <FastingPrompt
          day={promptDay}
          currentStatus={fastingLog[promptDay]}
          onRecord={handleRecord}
          onClose={handleClose}
        />
      )}
    </>
  );
}
