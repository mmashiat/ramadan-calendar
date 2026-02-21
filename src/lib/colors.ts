// Sun cycle color system
// Maps a 0-1 progress through the day (fajr to maghrib) to colors
// Then maghrib-to-isha is the "prompt to log" window

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

function rgbToString(c: RGB): string {
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
}

// Color stops — dawn to sunset
const FIRST_LIGHT: RGB = { r: 255, g: 251, b: 214 };   // soft pale yellow
const DAWN: RGB = { r: 253, g: 230, b: 138 };           // warm light yellow
const MORNING: RGB = { r: 251, g: 191, b: 36 };         // golden amber
const NOON: RGB = { r: 245, g: 180, b: 50 };            // bright warm gold
const AFTERNOON: RGB = { r: 234, g: 138, b: 30 };       // deepening amber
const LATE_AFTERNOON: RGB = { r: 234, g: 88, b: 12 };   // deep orange
const SUNSET: RGB = { r: 220, g: 50, b: 32 };           // sunset red-orange
const DUSK: RGB = { r: 153, g: 27, b: 27 };             // deep dusk red

function getGlowIntensity(progress: number): number {
  // Gentle at dawn, peaks at noon, fades into sunset
  if (progress < 0.1) return lerp(0.15, 0.5, progress / 0.1);
  if (progress < 0.3) return lerp(0.5, 0.75, (progress - 0.1) / 0.2);
  if (progress < 0.5) return 0.75;
  if (progress < 0.7) return lerp(0.75, 0.6, (progress - 0.5) / 0.2);
  if (progress < 0.85) return lerp(0.6, 0.4, (progress - 0.7) / 0.15);
  return lerp(0.4, 0.2, (progress - 0.85) / 0.15);
}

export interface SunColors {
  inner: string;
  outer: string;
  glow: string;
  glowIntensity: number;
}

export function getSunCycleColors(progress: number): SunColors {
  const p = Math.max(0, Math.min(1, progress));

  let inner: RGB;
  let outer: RGB;

  if (p < 0.08) {
    // First light — very soft pale yellow emerging from dark
    const t = p / 0.08;
    inner = lerpRGB({ r: 40, g: 38, b: 30 }, FIRST_LIGHT, t);
    outer = lerpRGB({ r: 30, g: 28, b: 20 }, { r: 180, g: 170, b: 100 }, t);
  } else if (p < 0.18) {
    // Dawn — light yellow warming up
    const t = (p - 0.08) / 0.1;
    inner = lerpRGB(FIRST_LIGHT, DAWN, t);
    outer = lerpRGB({ r: 180, g: 170, b: 100 }, { r: 200, g: 160, b: 60 }, t);
  } else if (p < 0.35) {
    // Morning — golden
    const t = (p - 0.18) / 0.17;
    inner = lerpRGB(DAWN, MORNING, t);
    outer = lerpRGB({ r: 200, g: 160, b: 60 }, { r: 217, g: 119, b: 6 }, t);
  } else if (p < 0.5) {
    // Late morning to noon — bright warm gold
    const t = (p - 0.35) / 0.15;
    inner = lerpRGB(MORNING, NOON, t);
    outer = lerpRGB({ r: 217, g: 119, b: 6 }, { r: 200, g: 130, b: 20 }, t);
  } else if (p < 0.65) {
    // Early afternoon — starting to deepen
    const t = (p - 0.5) / 0.15;
    inner = lerpRGB(NOON, AFTERNOON, t);
    outer = lerpRGB({ r: 200, g: 130, b: 20 }, { r: 180, g: 80, b: 10 }, t);
  } else if (p < 0.8) {
    // Late afternoon — deep orange
    const t = (p - 0.65) / 0.15;
    inner = lerpRGB(AFTERNOON, LATE_AFTERNOON, t);
    outer = lerpRGB({ r: 180, g: 80, b: 10 }, { r: 160, g: 50, b: 10 }, t);
  } else if (p < 0.92) {
    // Sunset — beautiful red-orange
    const t = (p - 0.8) / 0.12;
    inner = lerpRGB(LATE_AFTERNOON, SUNSET, t);
    outer = lerpRGB({ r: 160, g: 50, b: 10 }, { r: 130, g: 30, b: 20 }, t);
  } else {
    // Dusk — deep red fading
    const t = (p - 0.92) / 0.08;
    inner = lerpRGB(SUNSET, DUSK, t);
    outer = lerpRGB({ r: 130, g: 30, b: 20 }, { r: 60, g: 15, b: 15 }, t);
  }

  const glowIntensity = getGlowIntensity(p);

  return {
    inner: rgbToString(inner),
    outer: rgbToString(outer),
    glow: rgbToString(inner),
    glowIntensity,
  };
}

// Status colors
export const FASTED_COLORS: SunColors = {
  inner: 'rgb(16, 185, 129)',
  outer: 'rgb(5, 150, 105)',
  glow: 'rgb(16, 185, 129)',
  glowIntensity: 0.5,
};

export const MISSED_COLORS: SunColors = {
  inner: 'rgb(239, 68, 68)',
  outer: 'rgb(185, 28, 28)',
  glow: 'rgb(239, 68, 68)',
  glowIntensity: 0.4,
};

export const FUTURE_COLORS: SunColors = {
  inner: 'transparent',
  outer: 'rgb(51, 51, 51)',
  glow: 'transparent',
  glowIntensity: 0,
};

export const NIGHT_COLORS: SunColors = {
  inner: 'rgb(26, 26, 26)',
  outer: 'rgb(51, 51, 51)',
  glow: 'transparent',
  glowIntensity: 0,
};

// Post-maghrib: warm dim glow to signal "tap me"
export const PROMPT_COLORS: SunColors = {
  inner: 'rgb(80, 45, 20)',
  outer: 'rgb(50, 28, 12)',
  glow: 'rgb(180, 100, 40)',
  glowIntensity: 0.35,
};

// Streak-enhanced fasted colors — glow increases with streak length
export function getFastedStreakColors(streakLength: number): SunColors {
  const intensity = Math.min(0.8, 0.4 + streakLength * 0.05);
  return {
    inner: 'rgb(16, 185, 129)',
    outer: 'rgb(5, 150, 105)',
    glow: 'rgb(16, 185, 129)',
    glowIntensity: intensity,
  };
}
