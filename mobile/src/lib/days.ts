// Small helpers for the day report and the log: names for a date, and the day's score.
import type { GoalEntry, GoalStatus } from '@/lib/types';

const weekdays = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
const months = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];

function parse(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// "2026-11-06" -> "fredag"
export function weekdayName(iso: string): string {
  return weekdays[parse(iso).getDay()];
}

// "2026-11-06" -> "6. november"
export function dateLabel(iso: string): string {
  const date = parse(iso);
  return `${date.getDate()}. ${months[date.getMonth()]}`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('nb') + text.slice(1);
}

const points: Record<GoalStatus, number> = { done: 1, partial: 0.5, missed: 0 };

// done = 1, partial = 0.5. Returns the points and the number of goals.
export function dayScore(entries: GoalEntry[]): { points: number; total: number } {
  return { points: entries.reduce((sum, e) => sum + points[e.status], 0), total: entries.length };
}

// The day score 1–10 from docs/API.md (v1.1): 60 % goals, 40 % satisfaction.
// Without satisfaction it is the goals alone. Mirrors the backend so mock mode matches.
export function computeScore(entries: GoalEntry[], satisfaction: number | null): number | null {
  const { points: got, total } = dayScore(entries);
  if (!total) return null;
  const share = got / total;
  const mix = satisfaction === null ? share : 0.6 * share + (0.4 * (satisfaction - 1)) / 9;
  return Math.round((1 + 9 * mix) * 10) / 10;
}

// 7.4 -> "7,4", 7 -> "7,0". Scores always show one decimal.
export function formatScore(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

// 2 -> "2", 2.5 -> "2,5"
export function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}

export const statusWord: Record<GoalStatus, string> = { done: 'gjort', partial: 'delvis', missed: 'ikke i dag' };
