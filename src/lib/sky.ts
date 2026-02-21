// Sky gradient system — maps full-day progress (0-1 = midnight to midnight)
// to background colors, using fajr/maghrib breakpoints

interface RGB {
  r: number;
  g: number;
  b: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
  };
}

function rgbStr(c: RGB): string {
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
}

export interface SkyGradient {
  top: string;
  mid: string;
  bottom: string;
}

// Color definitions
const NIGHT: [RGB, RGB, RGB] = [
  { r: 10, g: 10, b: 46 },
  { r: 16, g: 16, b: 64 },
  { r: 13, g: 13, b: 26 },
];

const DAWN: [RGB, RGB, RGB] = [
  { r: 42, g: 21, b: 69 },
  { r: 212, g: 96, b: 64 },
  { r: 232, g: 160, b: 80 },
];

const MORNING: [RGB, RGB, RGB] = [
  { r: 64, g: 144, b: 208 },
  { r: 128, g: 192, b: 232 },
  { r: 240, g: 216, b: 144 },
];

const MIDDAY: [RGB, RGB, RGB] = [
  { r: 48, g: 128, b: 208 },
  { r: 96, g: 168, b: 224 },
  { r: 144, g: 200, b: 240 },
];

const AFTERNOON: [RGB, RGB, RGB] = [
  { r: 32, g: 96, b: 160 },
  { r: 208, g: 128, b: 64 },
  { r: 224, g: 104, b: 48 },
];

const SUNSET: [RGB, RGB, RGB] = [
  { r: 26, g: 16, b: 64 },
  { r: 192, g: 64, b: 48 },
  { r: 208, g: 96, b: 64 },
];

const DUSK: [RGB, RGB, RGB] = [
  { r: 16, g: 16, b: 53 },
  { r: 64, g: 32, b: 74 },
  { r: 32, g: 16, b: 48 },
];

function lerpTriple(a: [RGB, RGB, RGB], b: [RGB, RGB, RGB], t: number): [RGB, RGB, RGB] {
  return [lerpRGB(a[0], b[0], t), lerpRGB(a[1], b[1], t), lerpRGB(a[2], b[2], t)];
}

// Takes full-day progress (0-1) and fajr/maghrib fractions to compute sky colors
export function getSkyGradient(
  dayProgress: number,
  fajrFraction: number = 0.24,
  maghribFraction: number = 0.76,
): SkyGradient {
  const p = Math.max(0, Math.min(1, dayProgress));

  // Compute transition zones relative to prayer times
  const preDawn = fajrFraction - 0.03;     // ~45 min before fajr
  const sunrise = fajrFraction + 0.04;     // ~1hr after fajr
  const midMorning = fajrFraction + 0.08;
  const noon = (fajrFraction + maghribFraction) / 2;
  const preAfternoon = noon + 0.05;
  const preSunset = maghribFraction - 0.04;
  const postSunset = maghribFraction + 0.02;
  const postDusk = maghribFraction + 0.06;

  let colors: [RGB, RGB, RGB];

  if (p < preDawn) {
    // Deep night
    colors = NIGHT;
  } else if (p < fajrFraction) {
    // Pre-dawn → dawn
    const t = (p - preDawn) / (fajrFraction - preDawn);
    colors = lerpTriple(NIGHT, DAWN, t);
  } else if (p < sunrise) {
    // Dawn → sunrise
    const t = (p - fajrFraction) / (sunrise - fajrFraction);
    colors = lerpTriple(DAWN, MORNING, t);
  } else if (p < midMorning) {
    // Sunrise → morning
    const t = (p - sunrise) / (midMorning - sunrise);
    colors = lerpTriple(MORNING, MIDDAY, t);
  } else if (p < preAfternoon) {
    // Midday
    colors = MIDDAY;
  } else if (p < preSunset) {
    // Afternoon
    const t = (p - preAfternoon) / (preSunset - preAfternoon);
    colors = lerpTriple(MIDDAY, AFTERNOON, t);
  } else if (p < maghribFraction) {
    // Late afternoon → sunset
    const t = (p - preSunset) / (maghribFraction - preSunset);
    colors = lerpTriple(AFTERNOON, SUNSET, t);
  } else if (p < postSunset) {
    // Sunset → dusk
    const t = (p - maghribFraction) / (postSunset - maghribFraction);
    colors = lerpTriple(SUNSET, DUSK, t);
  } else if (p < postDusk) {
    // Dusk → night
    const t = (p - postSunset) / (postDusk - postSunset);
    colors = lerpTriple(DUSK, NIGHT, t);
  } else {
    // Night
    colors = NIGHT;
  }

  return {
    top: rgbStr(colors[0]),
    mid: rgbStr(colors[1]),
    bottom: rgbStr(colors[2]),
  };
}
