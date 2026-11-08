// Mirrors docs/API.md. Change both in the same commit.

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type GoalStatus = 'done' | 'partial' | 'missed';

export type Goal = {
  id: string;
  title: string;
  days: Weekday[];
  time: string | null;
  weeklyTarget: number | null;
  active: boolean;
};

export type GoalDraft = Omit<Goal, 'id' | 'active'>;

export type GoalEntry = {
  goalId: string;
  goalTitle: string;
  status: GoalStatus;
  reason: string | null;
  transcript: string | null;
};

export type DailyLog = {
  date: string;
  entries: GoalEntry[];
  reflection: string | null;
  summary: string;
  tomorrowTip: string;
};

export type Suggestion = {
  text: string;
  goalId: string | null;
  change: { fromDay: Weekday | null; toDay: Weekday | null; time: string | null } | null;
};

export type WeeklyReport = {
  week: string;
  wentWell: string[];
  patterns: string[];
  suggestions: Suggestion[];
};

export type Today = {
  date: string;
  goals: Goal[];
  reviewDone: boolean;
};

export type DayGoal = {
  goalId: string;
  goalTitle: string;
  status: GoalStatus | null; // null = not mentioned, ask the user
  reason: string | null;
};

export type DayInterpretation = {
  goals: DayGoal[];
  missing: string[];
};

export type Interpretation = {
  status: GoalStatus;
  reason: string | null;
};

export type ApplySuggestionResult = {
  goal: Goal;
  calendarUrl: string;
};

// GET /stats?weeks=N. rate = mean score (done 1, partial 0.5, missed 0), null = no data.
export type Stats = {
  from: string;
  to: string;
  overall: {
    rate: number | null;
    reviews: number;
    days: number;
    bestWeekday: Weekday | null;
    hardestWeekday: Weekday | null;
  };
  weekdays: Record<Weekday, number | null>;
  weeks: { week: string; rate: number | null }[];
  goals: {
    goalId: string;
    title: string;
    done: number;
    partial: number;
    missed: number;
    rate: number | null;
    weekdays: Record<Weekday, number | null>;
  }[];
  days: {
    date: string;
    reviewed: boolean;
    done: number;
    partial: number;
    missed: number;
    total: number;
    rate: number | null;
  }[];
};
