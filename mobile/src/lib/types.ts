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
  satisfaction: number | null; // 1–10
  score: number | null; // day score 1–10, one decimal
  suggestion: string | null; // AI: one concrete change to a goal or the weekly target
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
  scoreAverage: number | null; // mean of the day scores, one decimal
  daysAtTarget: number; // days with score >= targetScore
  daysReviewed: number;
  targetDays: number;
  targetScore: number;
  targetMet: boolean; // daysAtTarget >= targetDays
  dayScores: { date: string; score: number | null }[]; // 7 rows, mon–sun
};

// GET/PUT /settings. "At least targetScore/10 on targetDays of 7 days." Defaults 5 and 7.
export type Settings = {
  targetDays: number; // 1–7
  targetScore: number; // 1–10
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
    scoreAverage: number | null;
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
    score: number | null;
  }[];
};
