interface CelebrationOverlayProps {
  visible: boolean;
  onDismiss: () => void;
}

export function CelebrationOverlay({ visible, onDismiss }: CelebrationOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center animate-celebration-fade-in"
      onClick={onDismiss}
      style={{
        background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.15) 0%, rgba(0,0,0,0.4) 100%)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div className="text-center px-8">
        <div className="animate-celebration-scale-in">
          <p className="text-[32px] mb-3">&#127775;</p>
          <p className="text-[16px] font-semibold text-white/90 tracking-wide leading-relaxed">
            One week of fasting!
          </p>
          <p className="text-[11px] text-emerald-400/70 mt-2 tracking-[0.15em] uppercase">
            Keep going strong
          </p>
        </div>
      </div>
    </div>
  );
}
