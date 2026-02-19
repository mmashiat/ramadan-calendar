import { useLocation } from './hooks/useLocation';
import { usePrayerTimes } from './hooks/usePrayerTimes';
import { Header } from './components/Header';
import { RamadanGrid } from './components/RamadanGrid';
import { EidCountdown } from './components/EidCountdown';
import { LocationPrompt } from './components/LocationPrompt';

function App() {
  const { lat, lng, loading: locLoading, error: locError, needsPermission, requestLocation } = useLocation();
  const { times, loading: timesLoading, error: timesError } = usePrayerTimes(
    lat,
    lng,
    !locLoading && !needsPermission && lat !== 0
  );

  const loading = locLoading || timesLoading;
  const error = timesError;

  return (
    <div className="w-full max-w-[320px] mx-auto px-3 py-6">
      <div className="bg-[#111111] rounded-[20px] px-5 py-5 border border-white/[0.03] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <Header locationError={!needsPermission ? locError : null} />

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
            <RamadanGrid prayerTimes={times} />
            <EidCountdown />
          </>
        )}
      </div>

      <p className="text-center text-[8px] text-white/[0.08] mt-3 tracking-[0.15em]">
        Tap a circle after Maghrib to log your fast
      </p>
    </div>
  );
}

export default App;
