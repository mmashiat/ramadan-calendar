// Apple Weather-style sun arc showing current position between Imsak and Maghrib

interface SunArcProps {
  sunProgress: number; // 0-1 from fajr to maghrib
  fajrTime: string;    // Imsak time displayed on left
  maghribTime: string; // Maghrib time displayed on right
}

export function SunArc({ sunProgress, fajrTime, maghribTime }: SunArcProps) {
  const p = Math.max(0, Math.min(1, sunProgress));

  // Arc geometry — SVG viewBox is 280x90
  const arcStartX = 24;
  const arcEndX = 256;
  const arcY = 62;
  const arcPeakY = 10;

  // Sun position along quadratic bezier
  const t = p;
  const sunX = (1 - t) * (1 - t) * arcStartX + 2 * (1 - t) * t * 140 + t * t * arcEndX;
  const sunY = (1 - t) * (1 - t) * arcY + 2 * (1 - t) * t * arcPeakY + t * t * arcY;

  return (
    <div className="w-full">
      <svg viewBox="0 0 280 88" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Horizon line */}
        <line x1="24" y1="62" x2="256" y2="62" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

        {/* Full arc path — dashed */}
        <path
          d={`M ${arcStartX} ${arcY} Q 140 ${arcPeakY} ${arcEndX} ${arcY}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          strokeDasharray="4 3"
        />

        {/* Traveled arc — solid gradient */}
        {p > 0 && (
          <path
            d={`M ${arcStartX} ${arcY} Q 140 ${arcPeakY} ${arcEndX} ${arcY}`}
            fill="none"
            stroke="rgba(250, 200, 60, 0.3)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={`${p * 290} 290`}
          />
        )}

        {/* Sun glow */}
        <circle cx={sunX} cy={sunY} r="12" fill="rgba(250, 200, 60, 0.06)" />
        <circle cx={sunX} cy={sunY} r="8" fill="rgba(250, 200, 60, 0.12)" />

        {/* Sun dot */}
        <circle cx={sunX} cy={sunY} r="4.5" fill="rgb(250, 204, 60)" />
        <circle cx={sunX} cy={sunY} r="3" fill="rgb(255, 220, 100)" />

        {/* Imsak label (left) */}
        <text x="24" y="78" fill="rgba(255,255,255,0.25)" fontSize="7" textAnchor="start" fontFamily="inherit">
          Imsak {fajrTime}
        </text>

        {/* Maghrib label (right) */}
        <text x="256" y="78" fill="rgba(255,255,255,0.25)" fontSize="7" textAnchor="end" fontFamily="inherit">
          Maghrib {maghribTime}
        </text>
      </svg>
    </div>
  );
}
