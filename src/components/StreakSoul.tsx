import { useState, useEffect, useRef } from 'react';
import { getMoonPhase } from '../lib/moon';

interface StreakSoulProps {
  streak: number;
  ramadanDay: number;
  variant: 'tree' | 'moon';
  allComplete?: boolean;
}

function GrowingTree({ streak }: { streak: number }) {
  const progress = Math.min(streak / 30, 1);
  // Stages: 0=bare soil, 1=seed, 2=sprout, 3=sapling, 4=tree, 5=full tree with fruit
  const stage = streak <= 0 ? 0 : streak <= 3 ? 1 : streak <= 7 ? 2 : streak <= 14 ? 3 : streak <= 21 ? 4 : 5;

  return (
    <svg viewBox="0 0 120 100" width="120" height="100" style={{ overflow: 'visible' }}>
      {/* Ground */}
      <ellipse cx="60" cy="90" rx="45" ry="4"
        fill="rgba(139, 92, 46, 0.12)"
        style={{ transition: 'all 1s ease' }}
      />
      <line x1="15" y1="90" x2="105" y2="90"
        stroke="rgba(139, 92, 46, 0.15)" strokeWidth="0.5" />

      {/* Underground roots (stage 3+) */}
      {stage >= 3 && (
        <g style={{ transition: 'opacity 1s ease', opacity: Math.min((stage - 2) * 0.35, 1) }}>
          <path d="M60,90 Q50,96 35,94" fill="none" stroke="rgba(139,92,46,0.15)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M60,90 Q70,97 85,93" fill="none" stroke="rgba(139,92,46,0.15)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M60,90 Q55,98 42,98" fill="none" stroke="rgba(139,92,46,0.1)" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      )}

      {/* Trunk — grows taller and thicker */}
      {stage >= 1 && (() => {
        const trunkH = stage === 1 ? 6 : stage === 2 ? 18 : 14 + progress * 36;
        const trunkW = stage <= 2 ? 2 : 2 + stage * 0.8;
        const trunkColor = stage <= 2 ? 'rgba(16, 185, 129, 0.6)' : `rgba(120, 80, 40, ${0.4 + progress * 0.3})`;
        return (
          <rect
            x={60 - trunkW / 2} y={90 - trunkH}
            width={trunkW} height={trunkH}
            rx={trunkW / 2}
            fill={trunkColor}
            style={{ transition: 'all 1s ease' }}
          />
        );
      })()}

      {/* Branches (stage 3+) — organic curved paths */}
      {stage >= 3 && (() => {
        const baseY = 90 - (14 + progress * 36);
        const spread = 8 + stage * 4;
        const branchOpacity = 0.3 + progress * 0.3;
        return (
          <g style={{ transition: 'all 1s ease' }}>
            {/* Left branch */}
            <path
              d={`M60,${baseY + 10} Q${60 - spread * 0.5},${baseY + 4} ${60 - spread},${baseY + 2}`}
              fill="none" stroke={`rgba(120, 80, 40, ${branchOpacity})`}
              strokeWidth="1.8" strokeLinecap="round"
              style={{ transition: 'all 1s ease' }}
            />
            {/* Right branch */}
            <path
              d={`M60,${baseY + 14} Q${60 + spread * 0.6},${baseY + 6} ${60 + spread},${baseY + 4}`}
              fill="none" stroke={`rgba(120, 80, 40, ${branchOpacity})`}
              strokeWidth="1.8" strokeLinecap="round"
              style={{ transition: 'all 1s ease' }}
            />
            {/* Upper left */}
            {stage >= 4 && (
              <path
                d={`M60,${baseY + 4} Q${60 - spread * 0.4},${baseY - 4} ${60 - spread * 0.7},${baseY - 6}`}
                fill="none" stroke={`rgba(120, 80, 40, ${branchOpacity * 0.8})`}
                strokeWidth="1.2" strokeLinecap="round"
                style={{ transition: 'all 1s ease' }}
              />
            )}
            {/* Upper right */}
            {stage >= 4 && (
              <path
                d={`M60,${baseY + 6} Q${60 + spread * 0.3},${baseY - 2} ${60 + spread * 0.6},${baseY - 8}`}
                fill="none" stroke={`rgba(120, 80, 40, ${branchOpacity * 0.8})`}
                strokeWidth="1.2" strokeLinecap="round"
                style={{ transition: 'all 1s ease' }}
              />
            )}
          </g>
        );
      })()}

      {/* Canopy glow */}
      {stage >= 3 && (() => {
        const canopyY = 90 - (14 + progress * 36) - 2;
        const canopyR = 10 + stage * 5;
        return (
          <ellipse cx="60" cy={canopyY} rx={canopyR + 6} ry={canopyR + 4}
            fill={`rgba(16, 185, 129, ${0.03 + progress * 0.06})`}
            style={{ transition: 'all 1s ease', filter: `blur(${6 + progress * 8}px)` }}
          />
        );
      })()}

      {/* Leaves — organic clusters */}
      {stage >= 2 && (() => {
        const canopyY = 90 - (stage === 2 ? 18 : 14 + progress * 36);
        const leafR = stage === 2 ? 3 : 2 + stage * 1.2;
        const count = stage === 2 ? 3 : Math.min(stage * 5, 24);
        const spread = stage === 2 ? 6 : 8 + stage * 4;

        return (
          <g style={{ transition: 'all 1s ease' }}>
            {Array.from({ length: count }).map((_, i) => {
              const angle = (i / count) * Math.PI * 2 + i * 0.3;
              const dist = (spread * 0.3) + (i % 3) * (spread * 0.25);
              const lx = 60 + Math.cos(angle) * dist;
              const ly = canopyY + Math.sin(angle) * dist * 0.7 - 2;
              const size = leafR * (0.6 + (i % 4) * 0.15);
              const shade = i % 3 === 0 ? 'rgba(16, 185, 129,' : i % 3 === 1 ? 'rgba(34, 197, 94,' : 'rgba(5, 150, 105,';
              const opacity = 0.2 + progress * 0.4 + (i % 2) * 0.1;

              return (
                <ellipse
                  key={i}
                  cx={lx} cy={ly}
                  rx={size} ry={size * 0.8}
                  fill={`${shade}${Math.min(opacity, 0.7)})`}
                  style={{ transition: 'all 1s ease' }}
                />
              );
            })}
          </g>
        );
      })()}

      {/* Golden fruit (stage 5) */}
      {stage >= 5 && (() => {
        const canopyY = 90 - (14 + progress * 36);
        const spread = 8 + stage * 4;
        return [
          [60 - spread * 0.4, canopyY + 8],
          [60 + spread * 0.3, canopyY + 6],
          [60 - spread * 0.1, canopyY + 12],
          [60 + spread * 0.5, canopyY + 10],
          [60 - spread * 0.5, canopyY + 4],
          [60, canopyY + 2],
        ].map(([fx, fy], i) => (
          <circle
            key={`fruit-${i}`}
            cx={fx} cy={fy} r="2.5"
            fill="rgba(251, 191, 36, 0.75)"
            style={{
              transition: 'all 1s ease',
              filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.5))',
            }}
          />
        ));
      })()}

      {/* Seed sprout (stage 1) */}
      {stage === 1 && (
        <g style={{ transition: 'all 1s ease' }}>
          <ellipse cx="60" cy="87" rx="2.5" ry="1.8" fill="rgba(139, 92, 46, 0.4)" />
          <path d="M60,86 Q59,82 57,80" fill="none" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="56" cy="79.5" rx="2" ry="1.2" fill="rgba(16, 185, 129, 0.4)" transform="rotate(-20, 56, 79.5)" />
        </g>
      )}

      {/* Bare soil dots (stage 0) */}
      {stage === 0 && (
        <g>
          <circle cx="50" cy="89" r="1" fill="rgba(139, 92, 46, 0.15)" />
          <circle cx="60" cy="88.5" r="1.2" fill="rgba(139, 92, 46, 0.12)" />
          <circle cx="70" cy="89" r="0.8" fill="rgba(139, 92, 46, 0.1)" />
        </g>
      )}
    </svg>
  );
}

// Cycle order for the celebration animation: new → full → back to current
const CYCLE_DAYS = [1, 4, 7, 11, 15, 15, 21, 25, 28];

function RealMoon({ ramadanDay, allComplete }: { ramadanDay: number; allComplete?: boolean }) {
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

  const displayDay = animDay ?? ramadanDay;
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

export function StreakSoul({ streak, ramadanDay, variant, allComplete }: StreakSoulProps) {
  return (
    <div className="flex flex-col items-center" style={{ transition: 'all 0.8s ease' }}>
      {variant === 'tree' && <GrowingTree streak={streak} />}
      {variant === 'moon' && <RealMoon ramadanDay={ramadanDay} allComplete={allComplete} />}
    </div>
  );
}
