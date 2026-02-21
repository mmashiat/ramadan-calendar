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
    <div className="flex items-center justify-center mt-10 pt-5 pb-4">
      <span className="text-[13px] font-semibold text-white/40 tracking-[0.25em] uppercase leading-none">
        {daysLeft} {daysLeft === 1 ? 'day' : 'days'} until Eid
      </span>
    </div>
  );
}
