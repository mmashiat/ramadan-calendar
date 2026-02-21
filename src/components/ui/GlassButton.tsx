interface GlassButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'success' | 'danger';
  className?: string;
}

const variantStyles = {
  default: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  success: {
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
  },
  danger: {
    background: 'rgba(239, 68, 68, 0.10)',
    border: '1px solid rgba(239, 68, 68, 0.12)',
  },
};

const variantTextClass = {
  default: 'text-white/60',
  success: 'text-emerald-400/80',
  danger: 'text-red-400/70',
};

export function GlassButton({
  children,
  onClick,
  variant = 'default',
  className = '',
}: GlassButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        py-2.5 rounded-[12px] text-[12px] font-medium
        active:scale-[0.96] transition-all duration-150
        ${variantTextClass[variant]}
        ${className}
      `}
      style={{
        ...variantStyles[variant],
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </button>
  );
}
