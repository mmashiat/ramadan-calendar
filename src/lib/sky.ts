// Sky gradient system — maps sun progress to full-viewport background colors
// Inspired by Apple Weather sunrise/sunset animation

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

// Sky phase color definitions
const NIGHT_TOP: RGB = { r: 10, g: 10, b: 46 };
const NIGHT_MID: RGB = { r: 16, g: 16, b: 64 };
const NIGHT_BOTTOM: RGB = { r: 13, g: 13, b: 26 };

const DAWN_TOP: RGB = { r: 26, g: 16, b: 64 };
const DAWN_MID: RGB = { r: 74, g: 32, b: 96 };
const DAWN_BOTTOM: RGB = { r: 42, g: 21, b: 48 };

const SUNRISE_TOP: RGB = { r: 42, g: 21, b: 69 };
const SUNRISE_MID: RGB = { r: 212, g: 96, b: 64 };
const SUNRISE_BOTTOM: RGB = { r: 232, g: 160, b: 80 };

const MORNING_TOP: RGB = { r: 64, g: 144, b: 208 };
const MORNING_MID: RGB = { r: 128, g: 192, b: 232 };
const MORNING_BOTTOM: RGB = { r: 240, g: 216, b: 144 };

const DAY_TOP: RGB = { r: 48, g: 128, b: 208 };
const DAY_MID: RGB = { r: 96, g: 168, b: 224 };
const DAY_BOTTOM: RGB = { r: 144, g: 200, b: 240 };

const LATE_AFT_TOP: RGB = { r: 32, g: 96, b: 160 };
const LATE_AFT_MID: RGB = { r: 208, g: 128, b: 64 };
const LATE_AFT_BOTTOM: RGB = { r: 224, g: 104, b: 48 };

const SUNSET_TOP: RGB = { r: 26, g: 16, b: 64 };
const SUNSET_MID: RGB = { r: 192, g: 64, b: 48 };
const SUNSET_BOTTOM: RGB = { r: 208, g: 96, b: 64 };

const DUSK_TOP: RGB = { r: 16, g: 16, b: 53 };
const DUSK_MID: RGB = { r: 64, g: 32, b: 74 };
const DUSK_BOTTOM: RGB = { r: 32, g: 16, b: 48 };

export function getSkyGradient(sunProgress: number): SkyGradient {
  let top: RGB, mid: RGB, bottom: RGB;

  if (sunProgress === -1 || sunProgress === 3) {
    // Night
    top = NIGHT_TOP;
    mid = NIGHT_MID;
    bottom = NIGHT_BOTTOM;
  } else if (sunProgress === 2) {
    // Post-maghrib — deep twilight
    top = { r: 13, g: 13, b: 37 };
    mid = { r: 26, g: 16, b: 64 };
    bottom = { r: 21, g: 13, b: 32 };
  } else {
    // Daytime: 0 to 1
    const p = Math.max(0, Math.min(1, sunProgress));

    if (p < 0.08) {
      // Fajr / Dawn
      const t = p / 0.08;
      top = lerpRGB(NIGHT_TOP, DAWN_TOP, t);
      mid = lerpRGB(NIGHT_MID, DAWN_MID, t);
      bottom = lerpRGB(NIGHT_BOTTOM, DAWN_BOTTOM, t);
    } else if (p < 0.18) {
      // Early sunrise
      const t = (p - 0.08) / 0.1;
      top = lerpRGB(DAWN_TOP, SUNRISE_TOP, t);
      mid = lerpRGB(DAWN_MID, SUNRISE_MID, t);
      bottom = lerpRGB(DAWN_BOTTOM, SUNRISE_BOTTOM, t);
    } else if (p < 0.35) {
      // Morning — blue sky emerging
      const t = (p - 0.18) / 0.17;
      top = lerpRGB(SUNRISE_TOP, MORNING_TOP, t);
      mid = lerpRGB(SUNRISE_MID, MORNING_MID, t);
      bottom = lerpRGB(SUNRISE_BOTTOM, MORNING_BOTTOM, t);
    } else if (p < 0.65) {
      // Full day
      const t = (p - 0.35) / 0.3;
      top = lerpRGB(MORNING_TOP, DAY_TOP, t);
      mid = lerpRGB(MORNING_MID, DAY_MID, t);
      bottom = lerpRGB(MORNING_BOTTOM, DAY_BOTTOM, t);
    } else if (p < 0.8) {
      // Late afternoon
      const t = (p - 0.65) / 0.15;
      top = lerpRGB(DAY_TOP, LATE_AFT_TOP, t);
      mid = lerpRGB(DAY_MID, LATE_AFT_MID, t);
      bottom = lerpRGB(DAY_BOTTOM, LATE_AFT_BOTTOM, t);
    } else if (p < 0.92) {
      // Sunset
      const t = (p - 0.8) / 0.12;
      top = lerpRGB(LATE_AFT_TOP, SUNSET_TOP, t);
      mid = lerpRGB(LATE_AFT_MID, SUNSET_MID, t);
      bottom = lerpRGB(LATE_AFT_BOTTOM, SUNSET_BOTTOM, t);
    } else {
      // Dusk
      const t = (p - 0.92) / 0.08;
      top = lerpRGB(SUNSET_TOP, DUSK_TOP, t);
      mid = lerpRGB(SUNSET_MID, DUSK_MID, t);
      bottom = lerpRGB(SUNSET_BOTTOM, DUSK_BOTTOM, t);
    }
  }

  return {
    top: rgbStr(top),
    mid: rgbStr(mid),
    bottom: rgbStr(bottom),
  };
}
