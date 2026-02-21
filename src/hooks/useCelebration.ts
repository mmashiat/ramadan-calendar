import { useState, useEffect, useRef, useCallback } from 'react';

const CYCLE_DURATION = 3000; // 3 seconds for 3 full day/night cycles
const CONGRATS_DURATION = 3500; // show congrats text for 3.5 seconds

interface CelebrationState {
  animatedProgress: number | null;
  showCongrats: boolean;
  isCelebrating: boolean;
  triggerCelebration: () => void;
}

export function useCelebration(): CelebrationState {
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const triggerCelebration = useCallback(() => {
    setIsCelebrating(true);
    startTimeRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (!isCelebrating) return;

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;

      if (elapsed < CYCLE_DURATION) {
        // 3 full cycles: each cycle is CYCLE_DURATION/3 ms
        const cycleProgress = (elapsed / CYCLE_DURATION) * 3;
        const progress = cycleProgress % 1;
        setAnimatedProgress(progress);
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Animation done, show congrats
        setAnimatedProgress(null);
        setIsCelebrating(false);
        setShowCongrats(true);

        setTimeout(() => {
          setShowCongrats(false);
        }, CONGRATS_DURATION);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isCelebrating]);

  return { animatedProgress, showCongrats, isCelebrating, triggerCelebration };
}
