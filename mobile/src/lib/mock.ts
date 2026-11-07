// Mock data with exactly the same shape as the API (docs/API.md).
// Used while EXPO_PUBLIC_USE_MOCK is not "false".

import type { DailyLog, Goal, Today, WeeklyReport } from './types';

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
  wentWell: ['Kveldsrutinen holdt fem av sju dager.'],
  patterns: ['Trening faller bort på onsdager fordi du jobber sent.'],
  suggestions: [
    {
      text: 'Flytt trening fra onsdag til torsdag 07:00',
      goalId: 'g1',
      change: { fromDay: 'wed', toDay: 'thu', time: '07:00' },
    },
  ],
};
