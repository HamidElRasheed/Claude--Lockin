// Small Norwegian phrasing helpers for what the app "says".

const counts = ['Ingen ting', 'Én ting', 'To ting', 'Tre ting', 'Fire ting', 'Fem ting', 'Seks ting', 'Sju ting'];

export function countWord(n: number): string {
  return counts[n] ?? `${n} ting`;
}

export function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 10) return 'God morgen.';
  if (hour < 17) return 'Hei igjen.';
  return 'God kveld.';
}

export function isoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function localDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

const weekdays = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
const months = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];

// "2026-11-06" -> "Fredag 6. november" (no Intl: Hermes may lack Norwegian locale data).
export function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${weekdays[date.getDay()]} ${d}. ${months[m - 1]}`;
}

const shortDays: Record<string, string> = { mon: 'man', tue: 'tir', wed: 'ons', thu: 'tor', fri: 'fre', sat: 'lør', sun: 'søn' };
const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// ['mon','wed','fri'] -> "man, ons, fre"; all seven -> "Hver dag"; weekdays -> "Hverdager".
export function formatDays(days: string[]): string {
  if (days.length === 7) return 'Hver dag';
  const sorted = [...days].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
  if (sorted.join() === 'mon,tue,wed,thu,fri') return 'Hverdager';
  return sorted.map((d) => shortDays[d] ?? d).join(', ');
}
