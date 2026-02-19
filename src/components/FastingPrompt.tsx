interface FastingPromptProps {
  day: number;
  onRecord: (status: 'fasted' | 'missed') => void;
  onClose: () => void;
}

export function FastingPrompt({ day, onRecord, onClose }: FastingPromptProps) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#141414] rounded-[18px] p-5 mx-8 max-w-[260px] w-full border border-white/[0.05] shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center mb-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/10 flex items-center justify-center">
            <span className="text-[11px] text-amber-400/60 font-medium">{day}</span>
          </div>
        </div>
        <p className="text-center text-white/75 text-[13px] font-medium leading-snug">
          Did you complete<br/>your fast today?
        </p>
        <p className="text-center text-white/15 text-[9px] mt-1 mb-5">
          Alhamdulillah
        </p>

        <div className="flex gap-2.5">
          <button
            onClick={() => onRecord('fasted')}
            className="flex-1 py-2.5 rounded-[12px] bg-emerald-500/10 border border-emerald-500/12
                       text-emerald-400/80 text-[12px] font-medium
                       active:scale-[0.96] transition-all duration-150"
          >
            Yes
          </button>
          <button
            onClick={() => onRecord('missed')}
            className="flex-1 py-2.5 rounded-[12px] bg-red-500/8 border border-red-500/10
                       text-red-400/70 text-[12px] font-medium
                       active:scale-[0.96] transition-all duration-150"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
