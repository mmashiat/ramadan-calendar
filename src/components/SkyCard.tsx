import { useMemo } from 'react';
import { getSkyGradient } from '../lib/sky';

interface SkyCardProps {
  sunProgress: number;
  children: React.ReactNode;
}

export function SkyCard({ sunProgress, children }: SkyCardProps) {
  const gradient = useMemo(() => getSkyGradient(sunProgress), [sunProgress]);

  return (
    <div className="relative rounded-[24px] overflow-hidden">
      {/* Sky gradient background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `linear-gradient(to bottom, ${gradient.top}, ${gradient.mid} 55%, ${gradient.bottom})`,
          transition: 'background 3s ease-in-out',
        }}
      />

      {/* Glass overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(1px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-8 py-9">
        {children}
      </div>
    </div>
  );
}
