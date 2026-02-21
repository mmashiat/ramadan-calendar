import { useMemo } from 'react';
import {
  getSunCycleColors,
  getFastedStreakColors,
  FASTED_COLORS,
  MISSED_COLORS,
  FUTURE_COLORS,
  NIGHT_COLORS,
  PROMPT_COLORS,
  type SunColors,
} from '../lib/colors';
import type { FastingStatus } from '../lib/storage';

interface DayCircleProps {
  day: number;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  fastingStatus: FastingStatus;
  sunProgress: number;
  isInStreak: boolean;
  streakLength: number;
  onTap: () => void;
}

export function DayCircle({
  day,
  isToday,
  isPast,
  isFuture,
  fastingStatus,
  sunProgress,
  isInStreak,
  streakLength,
  onTap,
}: DayCircleProps) {
  const colors: SunColors = useMemo(() => {
    if (fastingStatus === 'fasted') {
      return isInStreak ? getFastedStreakColors(streakLength) : FASTED_COLORS;
    }
    if (fastingStatus === 'missed') return MISSED_COLORS;
    if (isPast && !fastingStatus) return NIGHT_COLORS;
    if (isToday) {
      if (sunProgress === -1) return NIGHT_COLORS;
      if (sunProgress === 2) return PROMPT_COLORS;
      if (sunProgress === 3) return NIGHT_COLORS;
      return getSunCycleColors(sunProgress);
    }
    return FUTURE_COLORS;
  }, [isToday, isPast, isFuture, fastingStatus, sunProgress, isInStreak, streakLength]);

  const shouldPulse = isToday && sunProgress === 2 && !fastingStatus;

  const isInteractive = !isFuture && (
    isPast ||
    (isToday && (sunProgress === 2 || sunProgress === 3))
  );

  const boxShadow = useMemo(() => {
    if (isInStreak && fastingStatus === 'fasted') {
      return `0 0 8px rgba(16, 185, 129, 0.4), 0 0 20px rgba(16, 185, 129, 0.15), 0 0 30px rgba(16, 185, 129, 0.08)`;
    }
    if (colors.glowIntensity > 0) {
      return `0 0 ${6 * colors.glowIntensity}px ${colors.glow}50, 0 0 ${12 * colors.glowIntensity}px ${colors.glow}20`;
    }
    return 'none';
  }, [isInStreak, fastingStatus, colors]);

  // Staggered entrance delay based on position
  const animDelay = `${day * 30}ms`;

  return (
    <div
      className="flex flex-col items-center gap-1 animate-circle-pop"
      style={{ animationDelay: animDelay }}
    >
      <button
        onClick={isInteractive ? onTap : undefined}
        className={`
          relative flex items-center justify-center
          w-[36px] h-[36px] rounded-full
          transition-all duration-300 ease-out
          ${isInteractive ? 'cursor-pointer active:scale-75 hover:scale-110' : 'cursor-default'}
          ${shouldPulse ? 'animate-pulse-glow' : ''}
        `}
        style={{
          background:
            colors.inner === 'transparent'
              ? 'transparent'
              : `radial-gradient(circle at 38% 38%, ${colors.inner}, ${colors.outer})`,
          border: isFuture || colors.inner === 'rgb(26, 26, 26)'
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid transparent',
          boxShadow,
        }}
        aria-label={`Day ${day}`}
      >
        <span
          className={`
            text-[10px] font-medium leading-none
            ${isFuture ? 'text-white/[0.15]' : ''}
            ${isToday && sunProgress >= 0 && sunProgress <= 0.4 ? 'text-black/40' : ''}
            ${isToday && sunProgress > 0.4 && sunProgress <= 1 ? 'text-white/50' : ''}
            ${isToday && sunProgress === 2 ? 'text-white/50' : ''}
            ${isToday && (sunProgress === -1 || sunProgress === 3) ? 'text-white/25' : ''}
            ${isPast && fastingStatus ? 'text-white/70' : ''}
            ${isPast && !fastingStatus ? 'text-white/20' : ''}
            ${fastingStatus ? 'text-white/70' : ''}
          `}
        >
          {day}
        </span>
      </button>

      {shouldPulse && (
        <span className="text-[7px] text-amber-400/50 tracking-wider animate-fade-in">
          tap
        </span>
      )}
    </div>
  );
}
