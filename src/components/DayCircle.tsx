import { useMemo } from 'react';
import {
  getSunCycleColors,
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
  sunProgress: number; // -1=pre-fajr, 0-1=day, 2=post-maghrib prompt, 3=late night
  onTap: () => void;
}

export function DayCircle({
  day,
  isToday,
  isPast,
  isFuture,
  fastingStatus,
  sunProgress,
  onTap,
}: DayCircleProps) {
  const colors: SunColors = useMemo(() => {
    // Already logged
    if (fastingStatus === 'fasted') return FASTED_COLORS;
    if (fastingStatus === 'missed') return MISSED_COLORS;

    // Past day, not logged
    if (isPast && !fastingStatus) return NIGHT_COLORS;

    // Today
    if (isToday) {
      if (sunProgress === -1) return NIGHT_COLORS;        // Before fajr
      if (sunProgress === 2) return PROMPT_COLORS;         // Post-maghrib — warm prompt glow
      if (sunProgress === 3) return NIGHT_COLORS;          // Late night
      return getSunCycleColors(sunProgress);                // During the fast
    }

    // Future
    return FUTURE_COLORS;
  }, [isToday, isPast, isFuture, fastingStatus, sunProgress]);

  const shouldPulse = isToday && sunProgress === 2 && !fastingStatus;
  const isInteractive = (isToday && (sunProgress === 2 || sunProgress === 3) && !fastingStatus)
    || (isPast && !fastingStatus);

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={isInteractive ? onTap : undefined}
        className={`
          relative flex items-center justify-center
          w-[26px] h-[26px] rounded-full
          transition-all duration-700 ease-out
          ${isInteractive ? 'cursor-pointer active:scale-90' : 'cursor-default'}
          ${shouldPulse ? 'animate-pulse-glow' : ''}
        `}
        style={{
          background:
            colors.inner === 'transparent'
              ? 'transparent'
              : `radial-gradient(circle at 38% 38%, ${colors.inner}, ${colors.outer})`,
          border: isFuture || colors.inner === 'rgb(26, 26, 26)'
            ? '1px solid rgba(255,255,255,0.06)'
            : '1px solid transparent',
          boxShadow:
            colors.glowIntensity > 0
              ? `0 0 ${6 * colors.glowIntensity}px ${colors.glow}50, 0 0 ${12 * colors.glowIntensity}px ${colors.glow}20`
              : 'none',
        }}
        aria-label={`Day ${day}`}
      >
        <span
          className={`
            text-[8px] font-medium leading-none
            ${isFuture ? 'text-white/[0.12]' : ''}
            ${isToday && sunProgress >= 0 && sunProgress <= 0.4 ? 'text-black/40' : ''}
            ${isToday && sunProgress > 0.4 && sunProgress <= 1 ? 'text-white/50' : ''}
            ${isToday && sunProgress === 2 ? 'text-white/50' : ''}
            ${isToday && (sunProgress === -1 || sunProgress === 3) ? 'text-white/25' : ''}
            ${isPast && fastingStatus ? 'text-white/60' : ''}
            ${isPast && !fastingStatus ? 'text-white/15' : ''}
            ${fastingStatus ? 'text-white/60' : ''}
          `}
        >
          {day}
        </span>
      </button>

      {/* Tap indicator for promptable circles */}
      {shouldPulse && (
        <span className="text-[6px] text-amber-400/50 tracking-wider animate-fade-in">
          tap
        </span>
      )}
    </div>
  );
}
