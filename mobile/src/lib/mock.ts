// Mock data with exactly the same shape as the API (docs/API.md).
// Used while EXPO_PUBLIC_USE_MOCK is not "false".

import type { DailyLog, Goal, GoalDraft, GoalEntry, Interpretation, Today, WeeklyReport } from './types';

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
  },
];

export const mockWeeklyReport: WeeklyReport = {
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

// Canned answers so the evening review can be demoed without a backend.
const mockAnswers = [
  'Nei, ble sittende sent på jobb igjen, så jeg rakk det ikke.',
  'Litt, kanskje ti minutter før jeg sovnet.',
  'Ja, la den i stua halv elleve.',
  'Lang dag, men jeg fikk ro på kvelden.',
];
let answerIndex = 0;

export function mockTranscribe(): { text: string } {
  const text = mockAnswers[answerIndex % mockAnswers.length];
  answerIndex += 1;
  return { text };
}

export function mockInterpret(text: string): Interpretation {
  const lower = text.toLowerCase();
  if (/\b(nei|ikke|rakk)\b/.test(lower)) return { status: 'missed', reason: 'Jobbet sent' };
  if (/\b(litt|delvis|halv|bare)\b/.test(lower)) return { status: 'partial', reason: 'Bare ti minutter' };
  return { status: 'done', reason: null };
}

export function mockCompleteReview(date: string, entries: GoalEntry[], reflection: string | null): DailyLog {
  const log: DailyLog = {
    date,
    entries,
    reflection,
    summary: 'Jobben tok treningen igjen, men kvelden ble rolig.',
    tomorrowTip: 'Legg treningstøyet frem før du legger deg.',
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
