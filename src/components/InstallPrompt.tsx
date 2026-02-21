import { useState, useEffect } from 'react';

const DISMISS_KEY = 'ramadan-install-dismissed';

function isStandalone(): boolean {
  return (
    ('standalone' in window.navigator && (window.navigator as any).standalone === true) ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  return /iP(hone|od|ad)/.test(ua) && /WebKit/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    // Small delay so it doesn't flash on load
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  };

  return (
    <div className="animate-fade-in" style={{ marginTop: '16px' }}>
      <div
        className="rounded-2xl px-5 py-4 text-center"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <p className="text-[11px] text-white/50 leading-relaxed">
          {isIOSSafari() ? (
            <>
              Tap{' '}
              <span className="inline-block align-middle text-[14px]">
                &#x2B06;&#xFE0F;
              </span>{' '}
              then <strong className="text-white/70">Add to Home Screen</strong> for the best experience
            </>
          ) : (
            <>
              Add this app to your home screen for the best experience
            </>
          )}
        </p>
        <button
          onClick={handleDismiss}
          className="mt-2 text-[9px] text-white/20 tracking-[0.1em] hover:text-white/40 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
