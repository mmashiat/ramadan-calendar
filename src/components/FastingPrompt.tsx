import { GlassButton } from './ui/GlassButton';

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
        className="rounded-[18px] p-5 mx-8 max-w-[260px] w-full"
        style={{
          background: 'rgba(10, 10, 10, 0.6)',
          backdropFilter: 'blur(32px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.3)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        }}
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
          <GlassButton
            onClick={() => onRecord('fasted')}
            variant="success"
            className="flex-1"
          >
            Yes
          </GlassButton>
          <GlassButton
            onClick={() => onRecord('missed')}
            variant="danger"
            className="flex-1"
          >
            No
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
