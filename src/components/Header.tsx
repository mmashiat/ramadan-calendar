import { RAMADAN_YEAR_AH } from '../lib/ramadan';

interface HeaderProps {
  locationError?: string | null;
}

export function Header({ locationError }: HeaderProps) {
  return (
    <div className="text-center mb-4">
      <h1 className="text-[13px] font-semibold tracking-[0.15em] text-white/80 uppercase">
        Ramadan {RAMADAN_YEAR_AH}
      </h1>
      <p className="text-[9px] text-white/20 mt-0.5 tracking-[0.2em] uppercase">
        Feb — Mar 2026
      </p>
      {locationError && (
        <p className="text-[8px] text-amber-500/40 mt-1">{locationError}</p>
      )}
    </div>
  );
}
