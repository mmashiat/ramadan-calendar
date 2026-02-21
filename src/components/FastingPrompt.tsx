import { GlassButton } from './ui/GlassButton';
import type { FastingStatus } from '../lib/storage';

interface FastingPromptProps {
  day: number;
  currentStatus: FastingStatus;
  onRecord: (status: 'fasted' | 'missed') => void;
  onClose: () => void;
}

export function FastingPrompt({ day, currentStatus, onRecord, onClose }: FastingPromptProps) {
  const isChanging = currentStatus !== null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="rounded-[20px] p-6 mx-8 max-w-[280px] w-full"
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
          <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/10 flex items-center justify-center">
            <span className="text-[12px] text-amber-400/60 font-medium">{day}</span>
          </div>
        </div>

        <p className="text-center text-white/80 text-[14px] font-medium leading-snug">
          {isChanging ? 'Update your fast?' : 'Did you complete\nyour fast today?'}
        </p>

        {isChanging && (
          <p className="text-center text-white/25 text-[10px] mt-1">
            Currently marked as{' '}
            <span className={currentStatus === 'fasted' ? 'text-emerald-400/60' : 'text-red-400/60'}>
              {currentStatus}
            </span>
          </p>
        )}

        {!isChanging && (
          <p className="text-center text-white/15 text-[9px] mt-1">
            Alhamdulillah
          </p>
        )}

        <div className="flex gap-3 mt-5">
          <GlassButton
            onClick={() => onRecord('fasted')}
            variant="success"
            className="flex-1"
          >
            {isChanging && currentStatus === 'fasted' ? 'Fasted' : 'Yes'}
          </GlassButton>
          <GlassButton
            onClick={() => onRecord('missed')}
            variant="danger"
            className="flex-1"
          >
            {isChanging && currentStatus === 'missed' ? 'Missed' : 'No'}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
