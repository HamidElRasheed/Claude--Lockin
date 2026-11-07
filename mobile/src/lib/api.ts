// All backend calls go through this file. Screens never call fetch directly.

import { mockGoals, mockLogs, mockToday, mockWeeklyReport } from './mock';
import type {
  DailyLog,
  Goal,
  GoalDraft,
  GoalEntry,
  Interpretation,
  Today,
  WeeklyReport,
} from './types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== 'false';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      body?.error?.code ?? 'unknown',
      body?.error?.message ?? 'Noe gikk galt. Prøv igjen.',
      res.status,
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function json(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export const api = {
  health: () => request<{ ok: boolean }>('/health'),

  getGoals: (): Promise<Goal[]> =>
    USE_MOCK ? Promise.resolve(mockGoals) : request('/goals'),

  createGoal: (draft: GoalDraft): Promise<Goal> => request('/goals', json(draft)),

  parseGoals: (text: string): Promise<GoalDraft[]> => request('/goals/parse', json({ text })),

  getToday: (): Promise<Today> =>
    USE_MOCK ? Promise.resolve(mockToday) : request('/today'),

  transcribe: async (audioUri: string): Promise<{ text: string }> => {
    const form = new FormData();
    // React Native FormData accepts { uri, name, type } for files.
    form.append('audio', { uri: audioUri, name: 'answer.m4a', type: 'audio/m4a' } as unknown as Blob);
    return request('/transcribe', { method: 'POST', body: form });
  },

  interpret: (goalId: string, text: string): Promise<Interpretation> =>
    request('/review/interpret', json({ goalId, text })),

  completeReview: (date: string, entries: GoalEntry[], reflection: string | null): Promise<DailyLog> =>
    request('/review/complete', json({ date, entries, reflection })),

  getLogs: (from: string, to: string): Promise<DailyLog[]> =>
    USE_MOCK ? Promise.resolve(mockLogs) : request(`/logs?from=${from}&to=${to}`),

  getLog: (date: string): Promise<DailyLog> => request(`/logs/${date}`),

  getWeeklyReport: (week: string): Promise<WeeklyReport> =>
    USE_MOCK ? Promise.resolve(mockWeeklyReport) : request(`/reports/weekly?week=${week}`),

  generateWeeklyReport: (week: string): Promise<WeeklyReport> =>
    request('/reports/weekly/generate', json({ week })),
};
