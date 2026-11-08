// DEMO ONLY: friend circles are shown visually for the pitch. No backend, no accounts.
// All names and numbers are made up and live only in the app.
// What a circle shares: evenings done and the day score. Never reasons or what you said.

export type Member = {
  id: string;
  name: string;
  initials: string;
  evenings: number; // reviews done this week, 0–7
  score: number; // mean day score this week, 1–10
  you?: boolean;
  doneToday: boolean;
};

export type CircleStanding = {
  id: string;
  name: string;
  members: number;
  score: number; // the circle's mean day score this week
  move: number; // places up (+) or down (−) since last week
  yours?: boolean;
};

export const myCircle = {
  name: 'Morgenfolka',
  week: 45,
  daysLeft: 2,
  inviteCode: 'LOCK-4821',
  members: [
    { id: 'm1', name: 'Abdulahi', initials: 'AB', evenings: 6, score: 8.1, doneToday: true },
    { id: 'm2', name: 'Du', initials: 'HE', evenings: 5, score: 7.6, you: true, doneToday: false },
    { id: 'm3', name: 'Sara', initials: 'SA', evenings: 5, score: 7.2, doneToday: true },
    { id: 'm4', name: 'Jonas', initials: 'JO', evenings: 4, score: 6.4, doneToday: false },
    { id: 'm5', name: 'Maja', initials: 'MA', evenings: 3, score: 5.9, doneToday: true },
  ] satisfies Member[],
};

export const circleStandings: CircleStanding[] = [
  { id: 'c1', name: 'Løpeklubben', members: 8, score: 8.2, move: 0 },
  { id: 'c2', name: 'Kontoret', members: 6, score: 7.9, move: 1 },
  { id: 'c3', name: 'Morgenfolka', members: 5, score: 7.0, move: 2, yours: true },
  { id: 'c4', name: 'Studiegjengen', members: 7, score: 6.8, move: -1 },
  { id: 'c5', name: 'Familien Berg', members: 4, score: 6.3, move: -2 },
  { id: 'c6', name: 'Oslo Sprint', members: 12, score: 6.1, move: 0 },
];

export const cheers = ['Heier på deg', 'Kveldsprat snart?', 'Sterk uke', 'Én dag av gangen'];
