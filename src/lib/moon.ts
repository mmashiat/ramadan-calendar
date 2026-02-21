// Moon phase mapping for Ramadan days
// Ramadan always starts near new moon (1 Ramadan ≈ new moon)

export interface MoonPhaseInfo {
  name: string;
  image: string;
}

const PHASES: { maxDay: number; name: string; image: string }[] = [
  { maxDay: 2,  name: 'New Moon',         image: '/moon/phase_new.1026_print.jpg' },
  { maxDay: 6,  name: 'Waxing Crescent',  image: '/moon/phase_waxing_crescent.0398_print.jpg' },
  { maxDay: 8,  name: 'First Quarter',    image: '/moon/phase_first_quarter.5440_print.jpg' },
  { maxDay: 13, name: 'Waxing Gibbous',   image: '/moon/phase_waxing_gibbous.4801_print.jpg' },
  { maxDay: 16, name: 'Full Moon',        image: '/moon/phase_full.3492_print.jpg' },
  { maxDay: 21, name: 'Waning Gibbous',   image: '/moon/phase_waning_gibbous.2172_print.jpg' },
  { maxDay: 23, name: 'Last Quarter',     image: '/moon/phase_third_quarter.2243_print.jpg' },
  { maxDay: 30, name: 'Waning Crescent',  image: '/moon/phase_waning_crescent.0903_print.jpg' },
];

export function getMoonPhase(ramadanDay: number): MoonPhaseInfo {
  const clamped = Math.max(1, Math.min(30, ramadanDay));
  for (const phase of PHASES) {
    if (clamped <= phase.maxDay) {
      return { name: phase.name, image: phase.image };
    }
  }
  return PHASES[PHASES.length - 1];
}
