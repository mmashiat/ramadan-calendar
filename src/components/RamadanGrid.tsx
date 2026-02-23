import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { RAMADAN_DAYS, getRamadanDay } from '../lib/ramadan';
import { getFastingStatus, setFastingStatus, type FastingStatus } from '../lib/storage';
import { DayCircle } from './DayCircle';
import { FastingPrompt } from './FastingPrompt';
import type { DayCycleInfo } from '../hooks/useSunCycle';
import type { CelebrationMessage } from '../hooks/useCelebration';

interface RamadanGridProps {
  dayCycle: DayCycleInfo;
  onCelebrate?: (message?: CelebrationMessage) => void;
  onFastedToast?: (message: CelebrationMessage) => void;
  onAllComplete?: () => void;
  onStreakChange?: (streak: number, totalFasted: number) => void;
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

function getMaxStreak(log: Record<number, FastingStatus>): number {
  let max = 0;
  let current = 0;
  for (let d = 1; d <= RAMADAN_DAYS; d++) {
    if (log[d] === 'fasted') {
      current++;
      if (current > max) max = current;
    } else {
      current = 0;
    }
  }
  return max;
}

export function RamadanGrid({ dayCycle, onCelebrate, onFastedToast, onAllComplete, onStreakChange }: RamadanGridProps) {
  const today = getRamadanDay(new Date());
  const prevMaxStreakRef = useRef<number>(0);

  const [fastingLog, setFastingLog] = useState<Record<number, FastingStatus>>(() => {
    const log: Record<number, FastingStatus> = {};
    for (let d = 1; d <= RAMADAN_DAYS; d++) {
      log[d] = getFastingStatus(d);
    }
    prevMaxStreakRef.current = getMaxStreak(log);
    return log;
  });

  const [promptDay, setPromptDay] = useState<number | null>(null);

  const handleTap = useCallback((day: number) => {
    setPromptDay(day);
  }, []);

  const handleRecord = useCallback((status: 'fasted' | 'missed') => {
    if (promptDay === null) return;
    setFastingStatus(promptDay, status);

    if (status === 'fasted') {
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);

      // Show text-only fasted overlay (no arc animation)
      if (onFastedToast) {
        setTimeout(() => {
          onFastedToast({
            emoji: '\u{2728}',
            title: 'Amazing, you did it!',
            subtitle: 'Another one in the books',
          });
        }, 200);
      }
    }

    setFastingLog(prev => {
      const next = { ...prev, [promptDay]: status };

      // Check streak milestones: 7, 14, 21 — these get the full arc animation
      if (status === 'fasted' && onCelebrate) {
        const prevMax = prevMaxStreakRef.current;
        const newMax = getMaxStreak(next);

        const milestones: { threshold: number; message: CelebrationMessage }[] = [
          { threshold: 7, message: { emoji: '\u{1F31F}', title: 'Weekly streak completed!', subtitle: "Let's go!" } },
          { threshold: 14, message: { emoji: '\u{1F525}', title: 'Two week streak!', subtitle: "You're unstoppable" } },
          { threshold: 21, message: { emoji: '\u{1F4AB}', title: 'Three week streak!', subtitle: 'Almost there' } },
        ];

        for (const { threshold, message } of milestones) {
          if (newMax >= threshold && prevMax < threshold) {
            setTimeout(() => onCelebrate(message), 4000);
            break;
          }
        }

        prevMaxStreakRef.current = newMax;
      }

      // Check if all 30 days are fasted
      if (status === 'fasted' && onAllComplete) {
        let allFasted = true;
        for (let d = 1; d <= RAMADAN_DAYS; d++) {
          if (next[d] !== 'fasted') { allFasted = false; break; }
        }
        if (allFasted) {
          setTimeout(() => onAllComplete(), 4500);
        }
      }

      return next;
    });
    setPromptDay(null);
  }, [promptDay, onCelebrate]);

  const handleClose = useCallback(() => {
    setPromptDay(null);
  }, []);

  const { streaks } = useMemo(() => computeStreaks(fastingLog), [fastingLog]);

  // Report current streak and total fasted to parent
  const currentStreak = useMemo(() => getMaxStreak(fastingLog), [fastingLog]);
  const totalFasted = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= RAMADAN_DAYS; d++) {
      if (fastingLog[d] === 'fasted') count++;
    }
    return count;
  }, [fastingLog]);
  useEffect(() => {
    onStreakChange?.(currentStreak, totalFasted);
  }, [currentStreak, totalFasted, onStreakChange]);

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
      <div className="grid grid-cols-[repeat(6,36px)] gap-3 justify-center place-items-center">
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
