// Ramadan 2026 (1447 AH) starts on February 18, 2026
// 30 days: Feb 18 - Mar 19, 2026

export const RAMADAN_START = new Date(2026, 1, 18); // Feb 18, 2026
export const RAMADAN_DAYS = 30;
export const RAMADAN_YEAR_AH = 1447;

export function getRamadanDay(date: Date): number {
  const start = new Date(RAMADAN_START);
  start.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1; // 1-indexed
}

export function getRamadanDate(day: number): Date {
  const date = new Date(RAMADAN_START);
  date.setDate(date.getDate() + (day - 1));
  return date;
}

export function isRamadan(date: Date): boolean {
  const day = getRamadanDay(date);
  return day >= 1 && day <= RAMADAN_DAYS;
}

export function formatRamadanDay(day: number): string {
  return day.toString();
}

// Eid al-Fitr 2026: March 20, 2026 (day after Ramadan ends)
export const EID_DATE = new Date(2026, 2, 20); // Mar 20, 2026

export function getDaysUntilEid(): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const eid = new Date(EID_DATE);
  eid.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((eid.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}
