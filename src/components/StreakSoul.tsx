import { useState, useEffect, useRef } from 'react';
import { getMoonPhase } from '../lib/moon';

interface StreakSoulProps {
  totalFasted: number;
  ramadanDay: number;
  allComplete?: boolean;
}

// Cycle order for the celebration animation: new → full → back to current
const CYCLE_DAYS = [1, 4, 7, 11, 15, 15, 21, 25, 28];

function RealMoon({ totalFasted, ramadanDay, allComplete }: { totalFasted: number; ramadanDay: number; allComplete?: boolean }) {
  const [animDay, setAnimDay] = useState<number | null>(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (!allComplete || hasPlayedRef.current) return;
    hasPlayedRef.current = true;

    // Animate through phases: new moon → full moon → settle on current day
    const fullCycle = [...CYCLE_DAYS, ramadanDay];
    let i = 0;
    setAnimDay(fullCycle[0]);

    const interval = setInterval(() => {
      i++;
      if (i >= fullCycle.length) {
        clearInterval(interval);
        setAnimDay(null); // return to real phase
        return;
      }
      setAnimDay(fullCycle[i]);
    }, 300);

    return () => clearInterval(interval);
  }, [allComplete, ramadanDay]);

  // Moon phase driven by total fasted days (progress), celebration overrides with animation
  const displayDay = animDay ?? Math.max(1, totalFasted);
  const { image, name } = getMoonPhase(displayDay);
  const illumination = Math.round(Math.sin((displayDay / 30) * Math.PI) * 100);
  const glowIntensity = illumination / 100;
  const isCelebrating = animDay !== null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative"
        style={{
          width: 90, height: 90,
          transform: isCelebrating ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Outer glow — intensifies with illumination */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(200, 210, 230, ${0.08 + glowIntensity * 0.15}) 0%, transparent 70%)`,
            transform: `scale(${isCelebrating ? 1.8 : 1.4})`,
            filter: `blur(${4 + glowIntensity * 8}px)`,
            transition: 'all 0.3s ease',
          }}
        />
        {/* Moon image */}
        <img
          src={image}
          alt={name}
          width={90}
          height={90}
          className="rounded-full relative"
          style={{
            filter: `brightness(${0.85 + glowIntensity * 0.35}) drop-shadow(0 0 ${4 + glowIntensity * 12}px rgba(200, 210, 230, ${0.1 + glowIntensity * 0.2}))`,
            transition: 'filter 0.3s ease',
          }}
        />
      </div>
      <div className="text-center">
        <p className="text-[10px] text-white/40 font-medium tracking-wide">{name}</p>
        <p className="text-[9px] text-white/20">{illumination}% illumination</p>
      </div>
    </div>
  );
}

export function StreakSoul({ totalFasted, ramadanDay, allComplete }: StreakSoulProps) {
  return (
    <div className="flex flex-col items-center" style={{ transition: 'all 0.8s ease' }}>
      <RealMoon totalFasted={totalFasted} ramadanDay={ramadanDay} allComplete={allComplete} />
    </div>
  );
}
