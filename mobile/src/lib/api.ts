// All backend calls go through this file. Screens never call fetch directly.

import {
  mockCompleteReview,
  mockCreateGoal,
  mockGoals,
  mockInterpret,
  mockLogs,
  mockParseGoals,
  mockToday,
  mockTranscribe,
  mockWeeklyReport,
} from './mock';
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
export const isMock = USE_MOCK;

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
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new ApiError('network', 'Får ikke kontakt med serveren.', 0);
  }
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

// Mock responses wait a little so loading states are visible in the prototype.
function later<T>(value: T, ms = 900): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function send(method: 'POST' | 'PATCH', body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export const api = {
  health: () => request<{ ok: boolean }>('/health'),

  getGoals: (): Promise<Goal[]> => (USE_MOCK ? Promise.resolve(mockGoals) : request('/goals')),

  createGoal: (draft: GoalDraft): Promise<Goal> =>
    USE_MOCK ? later(mockCreateGoal(draft), 200) : request('/goals', send('POST', draft)),

  updateGoal: (id: string, changes: Partial<GoalDraft> & { active?: boolean }): Promise<Goal> =>
    request(`/goals/${id}`, send('PATCH', changes)),

  parseGoals: (text: string): Promise<GoalDraft[]> =>
    USE_MOCK ? later(mockParseGoals(text), 1200) : request('/goals/parse', send('POST', { text })),

  getToday: (): Promise<Today> => (USE_MOCK ? Promise.resolve(mockToday) : request('/today')),

  transcribe: async (audioUri: string): Promise<{ text: string }> => {
    if (USE_MOCK) return later(mockTranscribe());
    const form = new FormData();
    // React Native FormData accepts { uri, name, type } for files.
    form.append('audio', { uri: audioUri, name: 'answer.m4a', type: 'audio/m4a' } as unknown as Blob);
    return request('/transcribe', { method: 'POST', body: form });
  },

  interpret: (goalId: string, text: string): Promise<Interpretation> =>
    USE_MOCK ? later(mockInterpret(text), 600) : request('/review/interpret', send('POST', { goalId, text })),

  completeReview: (date: string, entries: GoalEntry[], reflection: string | null): Promise<DailyLog> =>
    USE_MOCK
      ? later(mockCompleteReview(date, entries, reflection))
      : request('/review/complete', send('POST', { date, entries, reflection })),

  // Defaults to the last 30 days, newest first.
  getLogs: (): Promise<DailyLog[]> => (USE_MOCK ? Promise.resolve(mockLogs) : request('/logs')),

  getLog: (date: string): Promise<DailyLog> => {
    if (!USE_MOCK) return request(`/logs/${date}`);
    const log = mockLogs.find((l) => l.date === date);
    return log ? Promise.resolve(log) : Promise.reject(new ApiError('log_not_found', 'Fant ingen logg for dagen.', 404));
  },

  // Fetch the stored report; if none exists yet, ask the backend to write it (3–7 s).
  getWeeklyReport: async (week: string): Promise<WeeklyReport> => {
    if (USE_MOCK) return later(mockWeeklyReport, 600);
    try {
      return await request<WeeklyReport>(`/reports/weekly?week=${week}`);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'report_not_found') {
        return request('/reports/weekly/generate', send('POST', { week }));
      }
      throw error;
    }
  },
};
