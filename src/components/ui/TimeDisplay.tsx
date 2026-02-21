interface TimeDisplayProps {
  label: string;
  time: string;
}

export function TimeDisplay({ label, time }: TimeDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[8px] text-white/35 tracking-[0.15em] uppercase">
        {label}
      </span>
      <span className="text-[18px] font-light text-white/80 tabular-nums leading-none">
        {time}
      </span>
    </div>
  );
}
