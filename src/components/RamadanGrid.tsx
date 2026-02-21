import { useState, useCallback, useMemo } from 'react';
import { RAMADAN_DAYS, getRamadanDay } from '../lib/ramadan';
import { getFastingStatus, setFastingStatus, type FastingStatus } from '../lib/storage';
import { DayCircle } from './DayCircle';
import { FastingPrompt } from './FastingPrompt';

interface RamadanGridProps {
  sunProgress: number;
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

  let activeStreak = 0;
  for (let d = RAMADAN_DAYS; d >= 1; d--) {
    if (log[d] === 'fasted') {
      activeStreak = streaks.get(d) ?? 0;
      break;
    }
    if (log[d] === 'missed') break;
  }

  return { streaks, activeStreak };
}

export function RamadanGrid({ sunProgress }: RamadanGridProps) {
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

  const fastedCount = Object.values(fastingLog).filter(s => s === 'fasted').length;
  const missedCount = Object.values(fastingLog).filter(s => s === 'missed').length;

  const { streaks, activeStreak } = useMemo(() => computeStreaks(fastingLog), [fastingLog]);

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
      <div className="grid grid-cols-6 gap-3.5 place-items-center px-2">
        {days}
      </div>

      <div className="flex justify-center items-center gap-4 mt-6 pt-5 border-t border-white/[0.08]">
        {fastedCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-[6px] h-[6px] rounded-full bg-emerald-500/80" />
            <span className="text-[10px] text-white/30 tabular-nums">{fastedCount}</span>
          </div>
        )}
        {missedCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-[6px] h-[6px] rounded-full bg-red-500/80" />
            <span className="text-[10px] text-white/30 tabular-nums">{missedCount}</span>
          </div>
        )}
        {activeStreak >= 2 && (
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400/50 leading-none">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1c-1.5 3-4 4-4 8a4 4 0 0 0 8 0c0-4-2.5-5-4-8z" />
              </svg>
            </span>
            <span className="text-[10px] text-white/30 tabular-nums">{activeStreak} streak</span>
          </div>
        )}
        {fastedCount === 0 && missedCount === 0 && (
          <span className="text-[10px] text-white/20">Day {Math.min(today, 30)} of 30</span>
        )}
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
