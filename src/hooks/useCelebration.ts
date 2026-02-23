import { useState, useEffect, useRef, useCallback } from 'react';

const CYCLE_DURATION = 3000;
const CONGRATS_DURATION = 3500;

export interface CelebrationMessage {
  emoji: string;
  title: string;
  subtitle: string;
}

interface CelebrationState {
  animatedProgress: number | null;
  showCongrats: boolean;
  congratsMessage: CelebrationMessage | null;
  isCelebrating: boolean;
  triggerCelebration: (message?: CelebrationMessage) => void;
  showCongratsOnly: (message: CelebrationMessage) => void;
}

const DEFAULT_MESSAGE: CelebrationMessage = {
  emoji: '\u{1F31F}',
  title: 'One week of fasting!',
  subtitle: 'Keep going strong',
};

export function useCelebration(): CelebrationState {
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsMessage, setCongratsMessage] = useState<CelebrationMessage | null>(null);
  const [animatedProgress, setAnimatedProgress] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const queueRef = useRef<CelebrationMessage[]>([]);
  const congratsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNext = useCallback(() => {
    if (queueRef.current.length === 0) return;
    const msg = queueRef.current.shift()!;
    setCongratsMessage(msg);
    setShowCongrats(true);

    if (congratsTimerRef.current) clearTimeout(congratsTimerRef.current);
    congratsTimerRef.current = setTimeout(() => {
      setShowCongrats(false);
      setCongratsMessage(null);
      if (queueRef.current.length > 0) {
        setTimeout(() => showNext(), 300);
      }
    }, CONGRATS_DURATION);
  }, []);

  // Text overlay only — no sun arc animation
  const showCongratsOnly = useCallback((message: CelebrationMessage) => {
    if (isCelebrating || showCongrats) {
      queueRef.current.push(message);
      return;
    }

    setCongratsMessage(message);
    setShowCongrats(true);

    if (congratsTimerRef.current) clearTimeout(congratsTimerRef.current);
    congratsTimerRef.current = setTimeout(() => {
      setShowCongrats(false);
      setCongratsMessage(null);
      if (queueRef.current.length > 0) {
        setTimeout(() => showNext(), 300);
      }
    }, CONGRATS_DURATION);
  }, [isCelebrating, showCongrats, showNext]);

  // Full celebration with sun arc animation + text
  const triggerCelebration = useCallback((message?: CelebrationMessage) => {
    const msg = message ?? DEFAULT_MESSAGE;

    if (isCelebrating || showCongrats) {
      queueRef.current.push(msg);
      return;
    }

    setCongratsMessage(msg);
    setIsCelebrating(true);
    startTimeRef.current = performance.now();
  }, [isCelebrating, showCongrats]);

  useEffect(() => {
    if (!isCelebrating) return;

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;

      if (elapsed < CYCLE_DURATION) {
        const cycleProgress = (elapsed / CYCLE_DURATION) * 3;
        const progress = cycleProgress % 1;
        setAnimatedProgress(progress);
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setAnimatedProgress(null);
        setIsCelebrating(false);
        setShowCongrats(true);

        if (congratsTimerRef.current) clearTimeout(congratsTimerRef.current);
        congratsTimerRef.current = setTimeout(() => {
          setShowCongrats(false);
          setCongratsMessage(null);
          if (queueRef.current.length > 0) {
            setTimeout(() => showNext(), 300);
          }
        }, CONGRATS_DURATION);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isCelebrating, showNext]);

  return { animatedProgress, showCongrats, congratsMessage, isCelebrating, triggerCelebration, showCongratsOnly };
}
