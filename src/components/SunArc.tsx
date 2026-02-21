// Apple Weather-style sun arc showing current position between Fajr and Maghrib

interface SunArcProps {
  sunProgress: number; // 0-1 from fajr to maghrib
  fajrTime: string;
  maghribTime: string;
}

export function SunArc({ sunProgress, fajrTime, maghribTime }: SunArcProps) {
  const p = Math.max(0, Math.min(1, sunProgress));

  // Arc geometry — SVG viewBox is 280x80
  // The arc goes from (20, 65) to (260, 65) with a peak at (140, 12)
  const arcStartX = 20;
  const arcEndX = 260;
  const arcY = 65;
  const arcPeakY = 12;

  // Calculate sun position along the arc using quadratic bezier
  const t = p;
  const sunX = (1 - t) * (1 - t) * arcStartX + 2 * (1 - t) * t * 140 + t * t * arcEndX;
  const sunY = (1 - t) * (1 - t) * arcY + 2 * (1 - t) * t * arcPeakY + t * t * arcY;

  return (
    <div className="w-full my-2">
      <svg viewBox="0 0 280 85" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Horizon line */}
        <line x1="20" y1="65" x2="260" y2="65" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

        {/* Arc path — dashed below horizon portion */}
        <path
          d={`M ${arcStartX} ${arcY} Q 140 ${arcPeakY} ${arcEndX} ${arcY}`}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Traveled arc — solid up to current position */}
        {p > 0 && (
          <path
            d={`M ${arcStartX} ${arcY} Q 140 ${arcPeakY} ${arcEndX} ${arcY}`}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
            strokeDasharray={`${p * 300} 300`}
          />
        )}

        {/* Sun dot */}
        <circle cx={sunX} cy={sunY} r="5" fill="rgb(250, 200, 60)" />
        <circle cx={sunX} cy={sunY} r="9" fill="rgba(250, 200, 60, 0.15)" />

        {/* Fajr label */}
        <text x="20" y="78" fill="rgba(255,255,255,0.3)" fontSize="7" textAnchor="start" fontFamily="inherit">
          {fajrTime}
        </text>

        {/* Maghrib label */}
        <text x="260" y="78" fill="rgba(255,255,255,0.3)" fontSize="7" textAnchor="end" fontFamily="inherit">
          {maghribTime}
        </text>
      </svg>
    </div>
  );
}
