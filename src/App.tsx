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
import { StreakSoul } from './components/StreakSoul';

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
  const { isSupported: notifSupported, isDenied: notifDenied, enabled: notifEnabled, showSettingsHint, toggleNotifications, dismissSettingsHint } = useNotifications(todayTimes, lat, lng);

  // Override progress when user is scrubbing the arc
  const [scrubProgress, setScrubProgress] = useState<number | null>(null);

  const handleScrub = useCallback((progress: number | null) => {
    setScrubProgress(progress);
  }, []);

  // Streak tracking for soul visualization
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalFasted, setTotalFasted] = useState(0);

  const handleStreakChange = useCallback((streak: number, total: number) => {
    setCurrentStreak(streak);
    setTotalFasted(total);
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
            <RamadanGrid dayCycle={dayCycle} onCelebrate={triggerCelebration} onStreakChange={handleStreakChange} />

            {/* Staging: moon + tree side by side for comparison */}
            <div className="flex justify-center items-end gap-8 mt-4 mb-2">
              <div className="flex flex-col items-center gap-1">
                <StreakSoul streak={currentStreak} ramadanDay={today} variant="moon" allComplete={totalFasted >= 30} />
                <span className="text-[9px] text-white/20">Moon</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <StreakSoul streak={currentStreak} ramadanDay={today} variant="tree" />
                <span className="text-[9px] text-white/20">Tree</span>
              </div>
            </div>
            {currentStreak > 0 && (
              <p className="text-center text-[10px] text-white/20 mb-2">
                {currentStreak} day streak
              </p>
            )}

            <EidCountdown onChangeLocation={resetLocation} />

            {notifSupported && (
              <div className="flex flex-col items-center" style={{ marginTop: '8px', gap: '6px' }}>
                <button
                  onClick={toggleNotifications}
                  className="text-[10px] tracking-[0.05em] transition-all rounded-full active:scale-95"
                  style={{
                    padding: '6px 14px',
                    background: notifEnabled && !notifDenied
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(255, 255, 255, 0.04)',
                    color: notifDenied
                      ? 'rgba(255, 255, 255, 0.3)'
                      : notifEnabled
                        ? 'rgba(255, 255, 255, 0.5)'
                        : 'rgba(255, 255, 255, 0.25)',
                    border: `1px solid ${notifDenied ? 'rgba(255, 100, 100, 0.12)' : 'rgba(255, 255, 255, 0.06)'}`,
                  }}
                >
                  {notifDenied
                    ? 'Notifications blocked — tap to fix'
                    : notifEnabled
                      ? 'Notifications on'
                      : 'Enable notifications'}
                </button>

                {showSettingsHint && (
                  <div
                    className="text-[9px] text-center leading-relaxed animate-in fade-in"
                    style={{
                      color: 'rgba(255, 255, 255, 0.35)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      maxWidth: '240px',
                    }}
                  >
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>To enable notifications:</span>
                    <br />
                    Open Settings &gt; Safari &gt; Notifications
                    <br />
                    or tap the <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>AA</span> in the address bar
                    <button
                      onClick={(e) => { e.stopPropagation(); dismissSettingsHint(); }}
                      className="block mx-auto text-[9px] transition-colors"
                      style={{ marginTop: '6px', color: 'rgba(255, 255, 255, 0.2)' }}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
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
