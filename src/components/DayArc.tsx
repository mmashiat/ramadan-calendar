import { useRef, useCallback, useState } from 'react';

interface DayArcProps {
  dayProgress: number;       // 0-1 over 24h
  fajrFraction: number;      // where fajr is in 0-1
  maghribFraction: number;   // where maghrib is in 0-1
  imsakFraction: number;     // where imsak is in 0-1
  imsakTime: string;
  maghribTime: string;
  onScrub: (progress: number | null) => void;
}

export function DayArc({
  dayProgress,
  fajrFraction,
  maghribFraction,
  imsakFraction,
  imsakTime,
  maghribTime,
  onScrub,
}: DayArcProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // SVG geometry
  const W = 300;
  const H = 120;
  const horizonY = 70;
  const margin = 28;

  // Map fajr and maghrib to X positions
  const fajrX = margin + fajrFraction * (W - 2 * margin);
  const maghribX = margin + maghribFraction * (W - 2 * margin);
  const imsakX = margin + imsakFraction * (W - 2 * margin);

  // Sun arc: quadratic bezier above horizon between fajr and maghrib
  const sunMidX = (fajrX + maghribX) / 2;
  const sunPeakY = 14;

  // Moon arc: quadratic bezier below horizon for nighttime portions
  // Night goes from maghrib → midnight → next fajr
  // We show the night arc as a dip below horizon
  const moonDipY = horizonY + 38;

  // Compute orb position based on dayProgress
  function getOrbPosition(p: number): { x: number; y: number; isSun: boolean } {
    if (p >= fajrFraction && p <= maghribFraction) {
      // Daytime — sun on the upper arc
      const t = (p - fajrFraction) / (maghribFraction - fajrFraction);
      const x = (1 - t) * (1 - t) * fajrX + 2 * (1 - t) * t * sunMidX + t * t * maghribX;
      const y = (1 - t) * (1 - t) * horizonY + 2 * (1 - t) * t * sunPeakY + t * t * horizonY;
      return { x, y, isSun: true };
    } else {
      // Nighttime — moon on the lower arc
      // Normalize night progress: maghrib → midnight(1.0/0.0) → fajr
      let nightT: number;
      const nightSpan = 1 - maghribFraction + fajrFraction;
      if (p > maghribFraction) {
        nightT = (p - maghribFraction) / nightSpan;
      } else {
        nightT = (1 - maghribFraction + p) / nightSpan;
      }
      // Moon arc control points
      const nightStartX = maghribX;
      const nightEndX = fajrX;
      // The arc wraps around, so we need to handle the X going right → off screen → back from left
      // Simplified: just interpolate X linearly and Y as a dip
      const x = nightStartX + nightT * (W - 2 * margin + nightEndX - nightStartX);
      const wrappedX = margin + ((x - margin) % (W - 2 * margin + 0.001));
      const yDip = Math.sin(nightT * Math.PI);
      const y = horizonY + yDip * (moonDipY - horizonY);
      return { x: wrappedX, y, isSun: false };
    }
  }

  const orb = getOrbPosition(dayProgress);

  // Convert pointer position to dayProgress
  const pointerToProgress = useCallback((clientX: number): number => {
    if (!svgRef.current) return dayProgress;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, relX));
  }, [dayProgress]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    setIsDragging(true);
    onScrub(pointerToProgress(e.clientX));
  }, [onScrub, pointerToProgress]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    onScrub(pointerToProgress(e.clientX));
  }, [isDragging, onScrub, pointerToProgress]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    onScrub(null); // snap back to real time
  }, [onScrub]);

  // Sun arc path
  const sunArcPath = `M ${fajrX} ${horizonY} Q ${sunMidX} ${sunPeakY} ${maghribX} ${horizonY}`;

  // Moon arc path — a dip below horizon from maghrib to fajr
  const moonArcPath = `M ${maghribX} ${horizonY} Q ${W - margin + 10} ${moonDipY} ${W - margin} ${moonDipY - 5}`;
  const moonArcPath2 = `M ${margin} ${moonDipY - 5} Q ${margin - 10} ${moonDipY} ${fajrX} ${horizonY}`;

  return (
    <div className="w-full mb-6 select-none touch-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Horizon line */}
        <line
          x1={margin} y1={horizonY}
          x2={W - margin} y2={horizonY}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.5"
        />

        {/* Sun arc — dashed above horizon */}
        <path
          d={sunArcPath}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.8"
          strokeDasharray="4 3"
        />

        {/* Moon arc — dashed below horizon */}
        <path
          d={moonArcPath}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="0.8"
          strokeDasharray="3 4"
        />
        <path
          d={moonArcPath2}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="0.8"
          strokeDasharray="3 4"
        />

        {/* Traveled sun arc — golden */}
        {dayProgress >= fajrFraction && dayProgress <= maghribFraction && (
          <path
            d={sunArcPath}
            fill="none"
            stroke="rgba(250, 200, 60, 0.25)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={`${((dayProgress - fajrFraction) / (maghribFraction - fajrFraction)) * 300} 300`}
          />
        )}

        {/* Orb — interactive */}
        <g
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ cursor: 'grab' }}
        >
          {/* Hit area — larger invisible circle for easier touch */}
          <circle cx={orb.x} cy={orb.y} r="18" fill="transparent" />

          {orb.isSun ? (
            <>
              {/* Sun glow */}
              <circle cx={orb.x} cy={orb.y} r="14" fill="rgba(250, 200, 60, 0.06)" />
              <circle cx={orb.x} cy={orb.y} r="9" fill="rgba(250, 200, 60, 0.12)" />
              {/* Sun */}
              <circle cx={orb.x} cy={orb.y} r="5" fill="rgb(250, 204, 60)" />
              <circle cx={orb.x} cy={orb.y} r="3.5" fill="rgb(255, 225, 110)" />
            </>
          ) : (
            <>
              {/* Moon glow */}
              <circle cx={orb.x} cy={orb.y} r="12" fill="rgba(180, 190, 220, 0.06)" />
              <circle cx={orb.x} cy={orb.y} r="8" fill="rgba(180, 190, 220, 0.1)" />
              {/* Moon */}
              <circle cx={orb.x} cy={orb.y} r="5" fill="rgb(200, 205, 220)" />
              <circle cx={orb.x} cy={orb.y} r="3.5" fill="rgb(220, 225, 240)" />
              {/* Crescent shadow */}
              <circle cx={orb.x + 2} cy={orb.y - 1} r="4" fill="rgba(20, 20, 50, 0.6)" />
            </>
          )}
        </g>

        {/* Imsak marker + label */}
        <line
          x1={imsakX} y1={horizonY - 3}
          x2={imsakX} y2={horizonY + 3}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.5"
        />
        <text
          x={imsakX}
          y={horizonY + 14}
          fill="rgba(255,255,255,0.2)"
          fontSize="6"
          textAnchor="middle"
          fontFamily="inherit"
        >
          {imsakTime}
        </text>

        {/* Maghrib marker + label */}
        <line
          x1={maghribX} y1={horizonY - 3}
          x2={maghribX} y2={horizonY + 3}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.5"
        />
        <text
          x={maghribX}
          y={horizonY + 14}
          fill="rgba(255,255,255,0.2)"
          fontSize="6"
          textAnchor="middle"
          fontFamily="inherit"
        >
          {maghribTime}
        </text>

        {/* Dragging indicator */}
        {isDragging && (
          <text
            x={orb.x}
            y={orb.isSun ? orb.y - 14 : orb.y + 18}
            fill="rgba(255,255,255,0.4)"
            fontSize="7"
            textAnchor="middle"
            fontFamily="inherit"
          >
            {Math.round(dayProgress * 24).toString().padStart(2, '0')}:{Math.round((dayProgress * 1440) % 60).toString().padStart(2, '0')}
          </text>
        )}
      </svg>
    </div>
  );
}
