// Moon phase visual based on Ramadan day number
// Ramadan always starts near new moon, so day 1 ≈ new moon,
// day 15 ≈ full moon, day 30 ≈ waning crescent

interface MoonPhaseProps {
  ramadanDay: number;
}

function getMoonPhaseName(day: number): string {
  if (day <= 2) return 'New Moon';
  if (day <= 6) return 'Waxing Crescent';
  if (day <= 8) return 'First Quarter';
  if (day <= 13) return 'Waxing Gibbous';
  if (day <= 16) return 'Full Moon';
  if (day <= 21) return 'Waning Gibbous';
  if (day <= 23) return 'Last Quarter';
  return 'Waning Crescent';
}

// Returns illumination fraction 0-1-0 across the month
function getIllumination(day: number): number {
  // Peaks at day 15 (full moon)
  const phase = Math.sin((day / 30) * Math.PI);
  return Math.round(phase * 100) / 100;
}

export function MoonPhase({ ramadanDay }: MoonPhaseProps) {
  const phaseName = getMoonPhaseName(ramadanDay);
  const illumination = getIllumination(ramadanDay);
  const illPercent = Math.round(illumination * 100);

  // Moon phase visual using CSS clip-path
  // day 1-15: waxing (right side lit first), day 15-30: waning (left side lit)
  const isWaxing = ramadanDay <= 15;

  return (
    <div className="flex items-center justify-center gap-4 my-2">
      {/* Moon visual */}
      <div className="relative w-[48px] h-[48px]">
        {/* Dark base */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 45% 40%, rgb(60, 65, 80), rgb(30, 32, 42))',
            boxShadow: '0 0 15px rgba(140, 150, 180, 0.08)',
          }}
        />
        {/* Lit portion */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 45% 40%, rgb(200, 205, 220), rgb(150, 155, 170))',
          }}
        >
          {/* Shadow mask to create the phase shape */}
          <div
            className="absolute inset-0"
            style={{
              background: 'rgb(30, 32, 42)',
              borderRadius: '50%',
              // For waxing: shadow comes from left; for waning: from right
              transform: isWaxing
                ? `translateX(${(1 - illumination) * 100 - 50}%)`
                : `translateX(${50 - (1 - illumination) * 100}%)`,
            }}
          />
        </div>
        {/* Subtle surface texture */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05), transparent 60%)',
          }}
        />
      </div>

      {/* Phase info */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-white/50 font-medium tracking-wide">
          {phaseName}
        </span>
        <span className="text-[9px] text-white/25">
          {illPercent}% illumination
        </span>
      </div>
    </div>
  );
}
