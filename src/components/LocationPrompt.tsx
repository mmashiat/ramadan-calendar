interface LocationPromptProps {
  onRequest: () => void;
  error?: string | null;
}

export function LocationPrompt({ onRequest, error }: LocationPromptProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[220px] gap-4 px-4">
      <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400/70">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[12px] text-white/70 font-medium">Enable Location</p>
        <p className="text-[9px] text-white/25 mt-1 leading-relaxed max-w-[200px]">
          Prayer times are calculated based on your position for accurate Fajr and Maghrib times
        </p>
      </div>
      <button
        onClick={onRequest}
        className="px-5 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08]
                   text-[11px] text-white/60 font-medium tracking-wide
                   active:scale-95 transition-all duration-150"
      >
        Allow Location
      </button>
      {error && (
        <p className="text-[9px] text-amber-400/40 text-center">{error}</p>
      )}
    </div>
  );
}
