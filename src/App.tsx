import { useState, useCallback } from 'react';
import { useLocation } from './hooks/useLocation';
import { usePrayerTimes } from './hooks/usePrayerTimes';
import { useSunCycle } from './hooks/useSunCycle';
import { useCelebration } from './hooks/useCelebration';
import { useNotifications } from './hooks/useNotifications';
import { getRamadanDay } from './lib/ramadan';
import { SkyCard } from './components/SkyCard';
import { Header } from './components/Header';
import { DayArc } from './components/DayArc';
import { RamadanGrid } from './components/RamadanGrid';
import { EidCountdown } from './components/EidCountdown';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { LocationPrompt } from './components/LocationPrompt';
import { InstallPrompt } from './components/InstallPrompt';

function App() {
  const { lat, lng, loading: locLoading, error: locError, needsPermission, requestLocation, resetLocation } = useLocation();
  const { times, loading: timesLoading, error: timesError } = usePrayerTimes(
    lat,
    lng,
    !locLoading && !needsPermission && lat !== 0
  );

  const loading = locLoading || timesLoading;
  const error = timesError;

  const today = getRamadanDay(new Date());
  const todayTimes = times[today];
  const dayCycle = useSunCycle(todayTimes);

  // Notifications
  const { isSupported: notifSupported, isDenied: notifDenied, enabled: notifEnabled, toggleNotifications } = useNotifications(todayTimes);

  // Override progress when user is scrubbing the arc
  const [scrubProgress, setScrubProgress] = useState<number | null>(null);

  const handleScrub = useCallback((progress: number | null) => {
    setScrubProgress(progress);
  }, []);

  // 7-day streak celebration
  const { animatedProgress, showCongrats, isCelebrating, triggerCelebration } = useCelebration();

  // Display progress: celebration > scrub > real-time
  const displayProgress = animatedProgress ?? scrubProgress ?? dayCycle.dayProgress;
  const isScrubbing = scrubProgress !== null || isCelebrating;

  return (
    <div className="relative z-10 w-full max-w-[400px] mx-auto px-5 py-6 min-h-full flex flex-col justify-center">
      <SkyCard
        dayProgress={displayProgress}
        fajrFraction={dayCycle.fajrFraction}
        maghribFraction={dayCycle.maghribFraction}
        isScrubbing={isScrubbing}
      >
        <Header
          locationError={!needsPermission ? locError : null}
          todayPrayerTimes={todayTimes}
        />

        {needsPermission ? (
          <LocationPrompt onRequest={requestLocation} error={locError} />
        ) : loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-4 h-4 border-[1.5px] border-white/[0.06] border-t-white/30 rounded-full animate-spin" />
              <p className="text-[9px] text-white/15 tracking-wider">
                {locLoading ? 'Getting location...' : 'Loading prayer times...'}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-[10px] text-red-400/50 text-center px-4">{error}</p>
          </div>
        ) : (
          <>
            {todayTimes && (
              <DayArc
                dayProgress={displayProgress}
                fajrFraction={dayCycle.fajrFraction}
                maghribFraction={dayCycle.maghribFraction}
                imsakFraction={dayCycle.imsakFraction}
                imsakTime={todayTimes.imsak}
                maghribTime={todayTimes.maghrib}
                onScrub={handleScrub}
              />
            )}
            <RamadanGrid dayCycle={dayCycle} onCelebrate={triggerCelebration} />
            <EidCountdown onChangeLocation={resetLocation} />

            {notifSupported && (
              <div className="flex justify-center" style={{ marginTop: '8px' }}>
                <button
                  onClick={toggleNotifications}
                  className="text-[10px] tracking-[0.05em] transition-colors rounded-full"
                  style={{
                    padding: '6px 14px',
                    background: notifEnabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                    color: notifDenied
                      ? 'rgba(255, 255, 255, 0.15)'
                      : notifEnabled
                        ? 'rgba(255, 255, 255, 0.5)'
                        : 'rgba(255, 255, 255, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                  disabled={notifDenied}
                >
                  {notifDenied
                    ? 'Notifications blocked'
                    : notifEnabled
                      ? 'Notifications on'
                      : 'Enable notifications'}
                </button>
              </div>
            )}
          </>
        )}

        <CelebrationOverlay
          visible={showCongrats}
          onDismiss={() => {}}
        />
      </SkyCard>

      <InstallPrompt />
    </div>
  );
}

export default App;
