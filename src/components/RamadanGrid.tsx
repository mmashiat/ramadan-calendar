import { useState, useCallback, useMemo } from 'react';
import { RAMADAN_DAYS, getRamadanDay } from '../lib/ramadan';
import { getFastingStatus, setFastingStatus, type FastingStatus } from '../lib/storage';
import { DayCircle } from './DayCircle';
import { FastingPrompt } from './FastingPrompt';
import type { DayCycleInfo } from '../hooks/useSunCycle';

interface RamadanGridProps {
  dayCycle: DayCycleInfo;
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

export function RamadanGrid({ dayCycle }: RamadanGridProps) {
  const today = getRamadanDay(new Date());

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

  // Map dayCycle to the old sunProgress values that DayCircle expects
  // isDay=true → 0-1, post-maghrib → 2, pre-fajr → -1
  const circleSunProgress = dayCycle.isDay
    ? ((dayCycle.dayProgress - dayCycle.fajrFraction) / (dayCycle.maghribFraction - dayCycle.fajrFraction))
    : dayCycle.dayProgress > dayCycle.maghribFraction ? 2 : -1;

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
        sunProgress={isToday ? circleSunProgress : isPast ? 2 : -1}
        isInStreak={streakLength >= 2}
        streakLength={streakLength}
        onTap={() => handleTap(d)}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-6 gap-x-4 gap-y-5 place-items-center px-3">
        {days}
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
