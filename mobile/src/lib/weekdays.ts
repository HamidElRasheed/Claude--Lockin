// Weekday and week helpers for the week and progress screens (no Intl: Hermes may lack Norwegian).

import type { Weekday } from './types';
import { localDate } from './words';

export const weekdayOrder: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const weekdayLetter: Record<Weekday, string> = {
  mon: 'M',
  tue: 'T',
  wed: 'O',
  thu: 'T',
  fri: 'F',
  sat: 'L',
  sun: 'S',
};

export const weekdayName: Record<Weekday, string> = {
  mon: 'mandag',
  tue: 'tirsdag',
  wed: 'onsdag',
  thu: 'torsdag',
  fri: 'fredag',
  sat: 'lørdag',
  sun: 'søndag',
};

const shortMonths = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function weekdayOf(iso: string): Weekday {
  return weekdayOrder[(parseDate(iso).getDay() + 6) % 7];
}

// "2026-W44" -> the seven dates Monday..Sunday as "YYYY-MM-DD".
export function weekDates(week: string): string[] {
  const [year, w] = week.split('-W').map(Number);
  const jan4 = new Date(year, 0, 4);
  const monday = new Date(year, 0, 4 - ((jan4.getDay() + 6) % 7) + (w - 1) * 7);
  return weekdayOrder.map((_, i) => localDate(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)));
}

// "2026-10-26", "2026-11-01" -> "26. okt – 1. nov"
export function formatRange(from: string, to: string): string {
  const a = parseDate(from);
  const b = parseDate(to);
  const left = a.getMonth() === b.getMonth() ? `${a.getDate()}.` : `${a.getDate()}. ${shortMonths[a.getMonth()]}`;
  return `${left} – ${b.getDate()}. ${shortMonths[b.getMonth()]}`;
}

// 0.823 -> "82 %"
export function percent(rate: number | null): string {
  return rate === null ? '–' : `${Math.round(rate * 100)} %`;
}
