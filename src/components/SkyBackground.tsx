import { useMemo } from 'react';
import { getSkyGradient } from '../lib/sky';

interface SkyBackgroundProps {
  sunProgress: number;
}

export function SkyBackground({ sunProgress }: SkyBackgroundProps) {
  const gradient = useMemo(() => getSkyGradient(sunProgress), [sunProgress]);

  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        background: `linear-gradient(to bottom, ${gradient.top}, ${gradient.mid} 55%, ${gradient.bottom})`,
        transition: 'background 3s ease-in-out',
      }}
    />
  );
}
