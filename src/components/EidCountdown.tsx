import { useState, useEffect } from 'react';
import { getDaysUntilEid } from '../lib/ramadan';

export function EidCountdown() {
  const [daysLeft, setDaysLeft] = useState(getDaysUntilEid);

  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      setDaysLeft(getDaysUntilEid());
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, [daysLeft]);

  if (daysLeft === 0) {
    return (
      <div className="text-center mt-5 pt-4 border-t border-white/[0.08]">
        <p className="text-[13px] font-medium tracking-wide bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
          Eid Mubarak
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2.5 mt-5 pt-4 border-t border-white/[0.08]">
      <span className="text-[28px] font-extralight tracking-tight bg-gradient-to-b from-white/70 to-white/30 bg-clip-text text-transparent tabular-nums leading-none">
        {daysLeft}
      </span>
      <div className="flex flex-col gap-px">
        <span className="text-[8px] text-white/30 tracking-[0.2em] uppercase leading-none">
          {daysLeft === 1 ? 'day' : 'days'}
        </span>
        <span className="text-[8px] text-white/15 tracking-[0.12em] uppercase leading-none">
          until Eid
        </span>
      </div>
    </div>
  );
}
