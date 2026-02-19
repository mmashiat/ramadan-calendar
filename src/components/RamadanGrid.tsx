import { useState, useCallback } from 'react';
import { RAMADAN_DAYS, getRamadanDay } from '../lib/ramadan';
import { getFastingStatus, setFastingStatus, type FastingStatus, type DayPrayerTimes } from '../lib/storage';
import { useSunCycle } from '../hooks/useSunCycle';
import { DayCircle } from './DayCircle';
import { FastingPrompt } from './FastingPrompt';

interface RamadanGridProps {
  prayerTimes: Record<number, DayPrayerTimes>;
}

export function RamadanGrid({ prayerTimes }: RamadanGridProps) {
  const today = getRamadanDay(new Date());
  const todayTimes = prayerTimes[today];
  const sunProgress = useSunCycle(todayTimes);

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

  const days = [];
  for (let d = 1; d <= RAMADAN_DAYS; d++) {
    const isToday = d === today;
    const isPast = d < today;
    const isFuture = d > today;

    days.push(
      <DayCircle
        key={d}
        day={d}
        isToday={isToday}
        isPast={isPast}
        isFuture={isFuture}
        fastingStatus={fastingLog[d]}
        sunProgress={isToday ? sunProgress : isPast ? 2 : -1}
        onTap={() => handleTap(d)}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-6 gap-[6px] place-items-center">
        {days}
      </div>

      {/* Minimal stats */}
      <div className="flex justify-center items-center gap-4 mt-3.5 pt-3 border-t border-white/[0.04]">
        {fastedCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-[5px] h-[5px] rounded-full bg-emerald-500/80" />
            <span className="text-[9px] text-white/25 tabular-nums">{fastedCount}</span>
          </div>
        )}
        {missedCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-[5px] h-[5px] rounded-full bg-red-500/80" />
            <span className="text-[9px] text-white/25 tabular-nums">{missedCount}</span>
          </div>
        )}
        {fastedCount === 0 && missedCount === 0 && (
          <span className="text-[9px] text-white/15">Day {Math.min(today, 30)} of 30</span>
        )}
      </div>

      {promptDay !== null && (
        <FastingPrompt
          day={promptDay}
          onRecord={handleRecord}
          onClose={handleClose}
        />
      )}
    </>
  );
}
