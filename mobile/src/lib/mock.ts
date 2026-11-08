// Mock data with exactly the same shape as the API (docs/API.md).
// Used while EXPO_PUBLIC_USE_MOCK is not "false".

import type {
  DailyLog,
  DayInterpretation,
  Goal,
  GoalDraft,
  GoalEntry,
  Interpretation,
  Settings,
  Stats,
  Today,
  Weekday,
  WeeklyReport,
} from './types';
import { computeScore } from './days';
import { isoWeek, localDate } from './words';

export const mockGoals: Goal[] = [
  { id: 'g1', title: 'Trene', days: ['mon', 'wed', 'fri'], time: '07:00', weeklyTarget: 3, active: true },
  { id: 'g2', title: 'Lese 20 min', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], time: '21:00', weeklyTarget: null, active: true },
  { id: 'g3', title: 'Ingen mobil etter 23', days: ['mon', 'tue', 'wed', 'thu', 'sun'], time: '23:00', weeklyTarget: null, active: true },
];

export const mockToday: Today = {
  date: '2026-11-07',
  goals: mockGoals,
  reviewDone: false,
};

export const mockLogs: DailyLog[] = [
  {
    date: '2026-11-06',
    entries: [
      { goalId: 'g1', goalTitle: 'Trene', status: 'missed', reason: 'Jobbet sent', transcript: 'Nei, jobbet sent i dag.' },
      { goalId: 'g2', goalTitle: 'Lese 20 min', status: 'partial', reason: 'Bare ti minutter', transcript: 'Litt, kanskje ti minutter.' },
      { goalId: 'g3', goalTitle: 'Ingen mobil etter 23', status: 'done', reason: null, transcript: 'Ja.' },
    ],
    reflection: 'Lang dag, men fikk ro på kvelden.',
    summary: 'En travel dag der jobben tok treningen. Du holdt kveldsrutinen.',
    tomorrowTip: 'Legg treningstøyet frem i kveld.',
    satisfaction: 6,
    score: 5.7,
    suggestion: 'Onsdag har vært tung tre uker på rad. Vil du flytte treningen til torsdag kl. 07:00?',
  },
  {
    date: '2026-11-05',
    entries: [
      { goalId: 'g2', goalTitle: 'Lese 20 min', status: 'done', reason: null, transcript: 'Ja, leste en halvtime.' },
      { goalId: 'g3', goalTitle: 'Ingen mobil etter 23', status: 'done', reason: null, transcript: 'Ja.' },
    ],
    reflection: 'Rolig dag. Leste lenge.',
    summary: 'En rolig dag der begge målene holdt.',
    tomorrowTip: 'Gjør det samme med mobilen i morgen.',
    satisfaction: 8,
    score: 9.2,
    suggestion: null,
  },
];

let mockSettings: Settings = { targetDays: 5, targetScore: 7 };

export function mockGetSettings(): Settings {
  return { ...mockSettings };
}

export function mockUpdateSettings(changes: Partial<Settings>): Settings {
  mockSettings = { ...mockSettings, ...changes };
  return { ...mockSettings };
}

const mockDayScores: WeeklyReport['dayScores'] = [
  { date: '2026-11-02', score: 7.8 },
  { date: '2026-11-03', score: 8.2 },
  { date: '2026-11-04', score: 4.6 },
  { date: '2026-11-05', score: 9.2 },
  { date: '2026-11-06', score: 5.7 },
  { date: '2026-11-07', score: 8.4 },
  { date: '2026-11-08', score: 7.3 },
];

// The target fields follow the current settings, so the steppers on "Mål" show up here.
export function mockWeeklyReport(): WeeklyReport {
  const scored = mockDayScores.flatMap((d) => (d.score === null ? [] : [d.score]));
  const daysAtTarget = scored.filter((x) => x >= mockSettings.targetScore).length;
  return {
    ...mockWeeklyLetter,
    scoreAverage: scored.length ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 10) / 10 : null,
    daysAtTarget,
    daysReviewed: scored.length,
    targetDays: mockSettings.targetDays,
    targetScore: mockSettings.targetScore,
    targetMet: daysAtTarget >= mockSettings.targetDays,
    dayScores: mockDayScores,
  };
}

const mockWeeklyLetter: Pick<WeeklyReport, 'week' | 'wentWell' | 'patterns' | 'suggestions'> = {
  week: '2026-W45',
  wentWell: ['Lesingen gikk best når telefonen lå i stua.'],
  patterns: ['Onsdagene dine er tunge. Tre ganger ble treningen borte fordi du jobbet sent.'],
  suggestions: [
    {
      text: 'Skal vi flytte treningen til torsdag kl. 07:00?',
      goalId: 'g1',
      change: { fromDay: 'wed', toDay: 'thu', time: '07:00' },
    },
  ],
};

// Canned answers so the evening review can be demoed without a backend:
// first the whole day in one go, then a short answer about the goal that was not mentioned.
const mockAnswers = [
  'Kom meg på trening i morges før jobb. Leste litt, kanskje ti minutter før jeg sovnet. Lang dag, men jeg fikk ro på kvelden.',
  'Ja, la mobilen i stua før elleve.',
];
let answerIndex = 0;

export function mockTranscribe(): { text: string } {
  const text = mockAnswers[answerIndex % mockAnswers.length];
  answerIndex += 1;
  return { text };
}

// First goal done, second partial with a reason, the rest not mentioned (asked about after).
export function mockInterpretDay(goals: Goal[]): DayInterpretation {
  const day = goals.map((goal, i) => ({
    goalId: goal.id,
    goalTitle: goal.title,
    status: i === 0 ? ('done' as const) : i === 1 ? ('partial' as const) : null,
    reason: i === 0 ? 'trente før jobb' : i === 1 ? 'bare ti minutter' : null,
  }));
  return { goals: day, missing: day.filter((g) => g.status === null).map((g) => g.goalId) };
}

export function mockInterpret(text: string): Interpretation {
  const lower = text.toLowerCase();
  if (/(nei|ikke|rakk)/.test(lower)) return { status: 'missed', reason: 'jobbet sent' };
  if (/(litt|delvis|halv|bare)/.test(lower)) return { status: 'partial', reason: 'bare litt' };
  return { status: 'done', reason: null };
}

export function mockCompleteReview(
  date: string,
  entries: GoalEntry[],
  reflection: string | null,
  satisfaction: number | null,
): DailyLog {
  const log: DailyLog = {
    date,
    entries,
    reflection,
    summary: 'Jobben tok treningen igjen, men kvelden ble rolig.',
    tomorrowTip: 'Legg treningstøyet frem før du legger deg.',
    satisfaction,
    score: computeScore(entries, satisfaction),
    suggestion: 'Lesingen blir ofte kort på kvelden. Vil du flytte den til 20:30?',
  };
  answerIndex = 0;
  const existing = mockLogs.findIndex((l) => l.date === date);
  if (existing >= 0) mockLogs[existing] = log;
  else mockLogs.unshift(log);
  return log;
}

export function mockParseGoals(text: string): GoalDraft[] {
  if (text.trim().length < 3) return [];
  return [
    { title: 'Trene', days: ['mon', 'wed', 'fri'], time: '07:00', weeklyTarget: 3 },
    { title: 'Lese 20 min', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], time: '21:30', weeklyTarget: null },
  ];
}

export function mockCreateGoal(draft: GoalDraft): Goal {
  const goal: Goal = { ...draft, id: `g${mockGoals.length + 1}`, active: true };
  mockGoals.push(goal);
  return goal;
}

// A demo history for /stats, counted the same way as the backend (backend/app/services/stats.py).
// Wednesdays are heavy on purpose, so the dashboard shows the same pattern as the weekly report.
const statsToday = '2026-11-08';
const weekdayKeys: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const score = { done: 1, partial: 0.5, missed: 0 } as const;

function mockStatus(goalId: string, weekday: Weekday, week: number): GoalEntry['status'] {
  if (goalId === 'g1') {
    if (weekday === 'wed') return week % 3 === 0 ? 'partial' : 'missed';
    return weekday === 'fri' && week % 2 === 1 ? 'partial' : 'done';
  }
  if (goalId === 'g2') {
    if (weekday === 'wed' || weekday === 'sat') return 'partial';
    return weekday === 'thu' && week % 3 === 1 ? 'missed' : 'done';
  }
  if (weekday === 'wed') return week % 2 === 0 ? 'missed' : 'partial';
  return weekday === 'sun' ? 'partial' : 'done';
}

function mean(values: number[]): number | null {
  return values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 1000) / 1000 : null;
}

function byWeekday(scores: Partial<Record<Weekday, number[]>>): Record<Weekday, number | null> {
  return Object.fromEntries(weekdayKeys.map((wd) => [wd, mean(scores[wd] ?? [])])) as Record<Weekday, number | null>;
}

export function mockStats(weeks: number): Stats {
  const [y, m, d] = statsToday.split('-').map(Number);
  const end = new Date(y, m - 1, d);
  const start = new Date(y, m - 1, d - (7 * weeks - 1));
  const all: number[] = [];
  const perWeekday: Partial<Record<Weekday, number[]>> = {};
  const perWeek: Record<string, number[]> = {};
  const perGoal = mockGoals.map((goal) => ({
    goal,
    counts: { done: 0, partial: 0, missed: 0 },
    scores: [] as number[],
    weekdays: {} as Partial<Record<Weekday, number[]>>,
  }));
  const days: Stats['days'] = [];
  let reviews = 0;

  for (let i = 0; i < 7 * weeks; i += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const weekday = weekdayKeys[(date.getDay() + 6) % 7];
    const week = isoWeek(date);
    const reviewed = date.getTime() < end.getTime(); // tonight's review is still ahead
    const counts = { done: 0, partial: 0, missed: 0 };
    const dayScores: number[] = [];
    if (reviewed) {
      reviews += 1;
      for (const g of perGoal) {
        if (!g.goal.days.includes(weekday)) continue;
        const status = mockStatus(g.goal.id, weekday, Number(week.split('W')[1]));
        const s = score[status];
        counts[status] += 1;
        g.counts[status] += 1;
        g.scores.push(s);
        (g.weekdays[weekday] ??= []).push(s);
        (perWeekday[weekday] ??= []).push(s);
        (perWeek[week] ??= []).push(s);
        dayScores.push(s);
        all.push(s);
      }
    }
    perWeek[week] ??= [];
    const rate = mean(dayScores);
    days.push({ date: localDate(date), reviewed, ...counts, total: dayScores.length, rate, score: mockScore(rate) });
  }

  const weekdays = byWeekday(perWeekday);
  const scores = days.flatMap((d) => (d.score === null ? [] : [d.score]));
  const rated = weekdayKeys.filter((wd) => weekdays[wd] !== null);
  const pick = (better: (a: number, b: number) => boolean) =>
    rated.reduce<Weekday | null>((best, wd) => (best === null || better(weekdays[wd] ?? 0, weekdays[best] ?? 0) ? wd : best), null);

  return {
    from: localDate(start),
    to: localDate(end),
    overall: {
      rate: mean(all),
      reviews,
      days: 7 * weeks,
      bestWeekday: pick((a, b) => a > b),
      hardestWeekday: pick((a, b) => a < b),
      scoreAverage: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
    },
    weekdays,
    weeks: Object.keys(perWeek)
      .sort()
      .map((week) => ({ week, rate: mean(perWeek[week]) })),
    goals: perGoal.map((g) => ({
      goalId: g.goal.id,
      title: g.goal.title,
      ...g.counts,
      rate: mean(g.scores),
      weekdays: byWeekday(g.weekdays),
    })),
    days,
  };
}

// A believable day score for the demo history: satisfaction follows how the goals went.
function mockScore(rate: number | null): number | null {
  if (rate === null) return null;
  const satisfaction = 5 + Math.round(rate * 4);
  return Math.round((1 + 9 * (0.6 * rate + (0.4 * (satisfaction - 1)) / 9)) * 10) / 10;
}
