interface StreakSoulProps {
  streak: number;
  variant: 'tree' | 'moon' | 'lantern';
}

function GrowingTree({ streak }: { streak: number }) {
  const progress = Math.min(streak / 30, 1);
  // Stages: 0=bare, 1-3=seed, 4-7=sprout, 8-14=sapling, 15-21=tree, 22-30=full
  const stage = streak === 0 ? 0 : streak <= 3 ? 1 : streak <= 7 ? 2 : streak <= 14 ? 3 : streak <= 21 ? 4 : 5;

  const trunkHeight = 10 + progress * 30;
  const canopyRadius = stage >= 3 ? 4 + (stage - 2) * 6 : 0;
  const leafCount = stage >= 2 ? Math.min(stage * 3, 12) : 0;
  const hasFruit = stage >= 5;
  const glowIntensity = progress * 8;

  return (
    <svg viewBox="0 0 80 80" width="80" height="80" style={{ overflow: 'visible' }}>
      {/* Ground line */}
      <line x1="15" y1="72" x2="65" y2="72" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Roots (stage 3+) */}
      {stage >= 3 && (
        <g style={{ transition: 'opacity 0.8s ease', opacity: Math.min((stage - 2) * 0.3, 1) }}>
          <path d={`M40,72 Q35,76 28,75`} fill="none" stroke="rgba(139,92,46,0.3)" strokeWidth="1" />
          <path d={`M40,72 Q45,77 52,75`} fill="none" stroke="rgba(139,92,46,0.3)" strokeWidth="1" />
        </g>
      )}

      {/* Trunk */}
      <rect
        x="38.5"
        y={72 - trunkHeight}
        width="3"
        height={trunkHeight}
        rx="1.5"
        fill={stage <= 1 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(139, 92, 46, 0.6)'}
        style={{ transition: 'all 0.8s ease' }}
      />

      {/* Branches (stage 3+) */}
      {stage >= 3 && (
        <g style={{ transition: 'opacity 0.8s ease' }}>
          <line
            x1="40" y1={72 - trunkHeight + 8}
            x2={40 - 6 - stage * 2} y2={72 - trunkHeight + 2}
            stroke="rgba(139,92,46,0.5)" strokeWidth="1.5" strokeLinecap="round"
          />
          <line
            x1="40" y1={72 - trunkHeight + 12}
            x2={40 + 6 + stage * 2} y2={72 - trunkHeight + 6}
            stroke="rgba(139,92,46,0.5)" strokeWidth="1.5" strokeLinecap="round"
          />
        </g>
      )}

      {/* Canopy glow */}
      {canopyRadius > 0 && (
        <circle
          cx="40"
          cy={72 - trunkHeight - canopyRadius * 0.3}
          r={canopyRadius + 4}
          fill={`rgba(16, 185, 129, ${0.05 + progress * 0.1})`}
          style={{ transition: 'all 0.8s ease', filter: `blur(${glowIntensity}px)` }}
        />
      )}

      {/* Canopy */}
      {canopyRadius > 0 && (
        <circle
          cx="40"
          cy={72 - trunkHeight - canopyRadius * 0.3}
          r={canopyRadius}
          fill={`rgba(16, 185, 129, ${0.15 + progress * 0.25})`}
          style={{ transition: 'all 0.8s ease' }}
        />
      )}

      {/* Leaves */}
      {Array.from({ length: leafCount }).map((_, i) => {
        const angle = (i / leafCount) * Math.PI * 2 + Math.PI * 0.25;
        const dist = canopyRadius * 0.6 + (i % 3) * 3;
        const cx = 40 + Math.cos(angle) * dist;
        const cy = (72 - trunkHeight - canopyRadius * 0.3) + Math.sin(angle) * dist;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={1.5 + (stage >= 4 ? 0.5 : 0)}
            fill={`rgba(16, 185, 129, ${0.3 + progress * 0.4})`}
            style={{ transition: 'all 0.8s ease' }}
          />
        );
      })}

      {/* Fruit (stage 5) */}
      {hasFruit && [0, 1, 2, 3, 4].map(i => {
        const angle = (i / 5) * Math.PI * 2 + 0.5;
        const dist = canopyRadius * 0.5;
        const cx = 40 + Math.cos(angle) * dist;
        const cy = (72 - trunkHeight - canopyRadius * 0.3) + Math.sin(angle) * dist;
        return (
          <circle
            key={`fruit-${i}`}
            cx={cx}
            cy={cy}
            r="2"
            fill="rgba(251, 191, 36, 0.7)"
            style={{ transition: 'all 0.8s ease', filter: 'drop-shadow(0 0 3px rgba(251, 191, 36, 0.5))' }}
          />
        );
      })}

      {/* Seed (stage 1) */}
      {stage === 1 && (
        <ellipse
          cx="40" cy="69"
          rx="2" ry="1.5"
          fill="rgba(16, 185, 129, 0.6)"
          style={{ transition: 'all 0.8s ease' }}
        />
      )}
    </svg>
  );
}

function FillingMoon({ streak }: { streak: number }) {
  const progress = Math.min(streak / 30, 1);
  const r = 28;
  const cx = 40;
  const cy = 40;

  // Moon phase: use an ellipse clip to create crescent → full effect
  // When progress=0: thin crescent, progress=1: full moon
  const shadowOffset = r * 2 * (1 - progress) - r;
  const glowSize = 2 + progress * 10;
  const glowOpacity = 0.1 + progress * 0.3;

  // Stars appear at higher streaks
  const starCount = Math.floor(progress * 8);

  return (
    <svg viewBox="0 0 80 80" width="80" height="80" style={{ overflow: 'visible' }}>
      {/* Stars */}
      {Array.from({ length: starCount }).map((_, i) => {
        const positions = [
          [12, 15], [68, 20], [18, 60], [65, 55],
          [8, 38], [72, 35], [25, 10], [58, 68],
        ];
        const [sx, sy] = positions[i];
        return (
          <circle
            key={`star-${i}`}
            cx={sx} cy={sy} r={0.8 + (i % 2) * 0.4}
            fill={`rgba(255, 255, 255, ${0.2 + (i % 3) * 0.15})`}
            style={{
              transition: 'opacity 0.8s ease',
              animation: `pulse-glow ${2 + i * 0.3}s ease-in-out infinite`,
            }}
          />
        );
      })}

      {/* Outer glow */}
      <circle
        cx={cx} cy={cy} r={r + 6}
        fill={`rgba(251, 191, 36, ${glowOpacity * 0.3})`}
        style={{ transition: 'all 0.8s ease', filter: `blur(${glowSize}px)` }}
      />

      {/* Moon base (bright side) */}
      <defs>
        <clipPath id="moon-clip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>

      <circle
        cx={cx} cy={cy} r={r}
        fill="rgba(255, 255, 255, 0.12)"
        style={{ transition: 'all 0.8s ease' }}
      />

      {/* Illuminated portion */}
      <circle
        cx={cx} cy={cy} r={r}
        fill={`rgba(251, 230, 180, ${0.15 + progress * 0.35})`}
        clipPath="url(#moon-clip)"
        style={{ transition: 'all 0.8s ease' }}
      />

      {/* Shadow (creates crescent) */}
      <circle
        cx={cx + shadowOffset} cy={cy} r={r}
        fill="rgba(5, 5, 16, 0.95)"
        clipPath="url(#moon-clip)"
        style={{ transition: 'all 0.8s ease' }}
      />

      {/* Surface detail at higher fill */}
      {progress > 0.4 && (
        <g style={{ transition: 'opacity 0.8s ease', opacity: (progress - 0.4) * 1.5 }}>
          <circle cx={cx - 6} cy={cy - 4} r="3" fill="rgba(200, 170, 120, 0.08)" clipPath="url(#moon-clip)" />
          <circle cx={cx + 4} cy={cy + 6} r="4" fill="rgba(200, 170, 120, 0.06)" clipPath="url(#moon-clip)" />
          <circle cx={cx - 2} cy={cy + 10} r="2" fill="rgba(200, 170, 120, 0.07)" clipPath="url(#moon-clip)" />
        </g>
      )}
    </svg>
  );
}

function Lantern({ streak }: { streak: number }) {
  const progress = Math.min(streak / 30, 1);
  const fillHeight = progress * 32;
  const glowOpacity = 0.1 + progress * 0.5;
  const rayCount = progress > 0.5 ? Math.floor((progress - 0.5) * 12) : 0;
  const flicker = streak >= 15;

  return (
    <svg viewBox="0 0 80 80" width="80" height="80" style={{ overflow: 'visible' }}>
      {/* Outer glow */}
      <ellipse
        cx="40" cy="42" rx={12 + progress * 15} ry={16 + progress * 15}
        fill={`rgba(245, 158, 11, ${glowOpacity * 0.15})`}
        style={{ transition: 'all 0.8s ease', filter: `blur(${8 + progress * 10}px)` }}
      />

      {/* Light rays */}
      {Array.from({ length: rayCount }).map((_, i) => {
        const angle = (i / Math.max(rayCount, 1)) * Math.PI * 2;
        const len = 8 + progress * 12;
        return (
          <line
            key={`ray-${i}`}
            x1={40 + Math.cos(angle) * 14}
            y1={42 + Math.sin(angle) * 18}
            x2={40 + Math.cos(angle) * (14 + len)}
            y2={42 + Math.sin(angle) * (18 + len)}
            stroke={`rgba(251, 191, 36, ${0.06 + progress * 0.08})`}
            strokeWidth="0.5"
            style={{ transition: 'all 0.8s ease' }}
          />
        );
      })}

      {/* Top cap */}
      <path
        d="M36,20 L44,20 L43,24 L37,24 Z"
        fill="rgba(255, 255, 255, 0.15)"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="0.5"
      />

      {/* Hook */}
      <path
        d="M39,20 Q40,14 41,20"
        fill="none"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Lantern body outline */}
      <path
        d="M37,24 Q32,28 31,42 Q32,56 37,60 L43,60 Q48,56 49,42 Q48,28 43,24 Z"
        fill="rgba(255, 255, 255, 0.04)"
        stroke="rgba(255, 255, 255, 0.15)"
        strokeWidth="0.8"
      />

      {/* Decorative bands */}
      <line x1="32" y1="34" x2="48" y2="34" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      <line x1="31.5" y1="42" x2="48.5" y2="42" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      <line x1="32" y1="50" x2="48" y2="50" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

      {/* Fill (light from bottom) */}
      <defs>
        <clipPath id="lantern-clip">
          <path d="M37,24 Q32,28 31,42 Q32,56 37,60 L43,60 Q48,56 49,42 Q48,28 43,24 Z" />
        </clipPath>
        <linearGradient id="lantern-fill" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(245, 158, 11, 0.6)" />
          <stop offset="50%" stopColor="rgba(251, 191, 36, 0.4)" />
          <stop offset="100%" stopColor="rgba(251, 230, 180, 0.2)" />
        </linearGradient>
      </defs>

      <rect
        x="30"
        y={60 - fillHeight}
        width="20"
        height={fillHeight}
        fill="url(#lantern-fill)"
        clipPath="url(#lantern-clip)"
        style={{
          transition: 'all 0.8s ease',
          ...(flicker ? { animation: 'lantern-flicker 3s ease-in-out infinite' } : {}),
        }}
      />

      {/* Inner glow spot */}
      {progress > 0 && (
        <ellipse
          cx="40" cy={58 - fillHeight * 0.5}
          rx={4 + progress * 3} ry={3 + progress * 2}
          fill={`rgba(255, 230, 150, ${progress * 0.2})`}
          clipPath="url(#lantern-clip)"
          style={{ transition: 'all 0.8s ease', filter: `blur(${2 + progress * 3}px)` }}
        />
      )}

      {/* Bottom */}
      <path
        d="M37,60 L36,63 L44,63 L43,60"
        fill="rgba(255, 255, 255, 0.12)"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function StreakSoul({ streak, variant }: StreakSoulProps) {
  if (streak === 0) return null;

  return (
    <div className="flex flex-col items-center" style={{ transition: 'all 0.8s ease' }}>
      {variant === 'tree' && <GrowingTree streak={streak} />}
      {variant === 'moon' && <FillingMoon streak={streak} />}
      {variant === 'lantern' && <Lantern streak={streak} />}
    </div>
  );
}
