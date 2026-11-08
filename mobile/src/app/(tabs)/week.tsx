import { useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ChoicePills } from '@/components/ChoicePills';
import { HeroCard } from '@/components/HeroCard';
import { Screen } from '@/components/Screen';
import { StatCard } from '@/components/StatCard';
import { TargetDots } from '@/components/TargetDots';
import { Voice } from '@/components/Voice';
import { WeekBars, type Bar } from '@/components/WeekBars';
import { ApiError, api } from '@/lib/api';
import { formatScore } from '@/lib/days';
import type { DailyLog, Stats, Suggestion, WeeklyReport } from '@/lib/types';
import { formatRange, percent, weekDates, weekdayLetter, weekdayOf } from '@/lib/weekdays';
import { isoWeek } from '@/lib/words';
import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'empty' } | { kind: 'ready'; report: WeeklyReport };

// The report covers last week, which is complete (backend suggestion in SYNC.md).
function lastWeek(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return isoWeek(d);
}

// The weekly report: the week in one number, the goals in small cards, then why, then one offer.
export default function WeekScreen() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  // Numbers are a bonus on top of the letter: if they fail, the letter still shows.
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<DailyLog[] | null>(null);

  const fetchData = useCallback(() => {
    api
      .getWeeklyReport(lastWeek())
      .then((report) => setState({ kind: 'ready', report }))
      .catch((error) =>
        setState(error instanceof ApiError && error.code === 'no_logs_for_week' ? { kind: 'empty' } : { kind: 'error' }),
      );
    // Two weeks of stats always contain all of last week, whatever today is.
    api.getStats(2).then(setStats, () => setStats(null));
    api.getLogs().then(setLogs, () => setLogs(null));
  }, []);

  // Refetch on every visit, so a changed weekly target on Mål shows here at once.
  useFocusEffect(fetchData);

  const retry = () => {
    setState({ kind: 'loading' });
    fetchData();
  };

  const dates = state.kind === 'ready' ? weekDates(state.report.week) : null;

  return (
    <Screen tone="dawn" inTabs>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.caption}>{dates ? formatRange(dates[0], dates[6]) : 'Forrige uke'}</Text>
          <Voice tone="dawn">Uka di</Voice>
        </View>

        {state.kind === 'loading' && (
          <View style={styles.quiet}>
            <ActivityIndicator color={palette.textMuted} />
            <Text style={styles.muted}>Skriver uka di …</Text>
          </View>
        )}

        {state.kind === 'empty' && (
          <Text style={styles.muted}>Forrige uke er tom. Snakk med meg noen kvelder, så ser vi mønstrene sammen.</Text>
        )}

        {state.kind === 'error' && (
          <View style={styles.quiet}>
            <Text style={styles.muted}>Fikk ikke hentet uka di.</Text>
            <Button tone="dawn" variant="tonal" label="Prøv igjen" onPress={retry} />
          </View>
        )}

        {state.kind === 'ready' && dates && <Report report={state.report} dates={dates} stats={stats} logs={logs} />}
      </ScrollView>
    </Screen>
  );
}

type ReportProps = { report: WeeklyReport; dates: string[]; stats: Stats | null; logs: DailyLog[] | null };

function Report({ report, dates, stats, logs }: ReportProps) {
  const empty = report.patterns.length === 0 && report.wentWell.length === 0;
  const hero = stats ? weekHero(stats, dates) : null;
  const scored = report.scoreAverage !== null && report.scoreAverage !== undefined;
  const cards = logs ? goalCards(logs, dates) : [];

  if (empty && !hero && !scored) {
    return <Text style={styles.muted}>Uka har så vidt begynt. Snakk med meg noen kvelder, så ser vi mønstrene sammen.</Text>;
  }

  return (
    <View style={styles.sections}>
      {scored ? (
        <HeroCard value={formatScore(report.scoreAverage ?? 0)} label="/10 i snitt">
          <View style={styles.target}>
            <TargetDots days={report.dayScores} target={report.targetScore} />
            <Text style={styles.targetText}>{targetLine(report)}</Text>
          </View>
        </HeroCard>
      ) : (
        hero && (
          <HeroCard value={percent(hero.rate)} label={`${hero.done} av ${hero.total} holdt`}>
          <WeekBars bars={hero.bars} />
          </HeroCard>
        )
      )}

      {cards.length > 0 && (
        <View style={styles.cards}>
          {cards.map((c) => (
            <StatCard key={c.title} label={c.title} value={`${c.done}/${c.total}`} note={c.note} />
          ))}
        </View>
      )}

      {report.patterns.length > 0 && (
        <Section label="Mønster">
          {report.patterns.map((p, i) => (
            <Paragraph key={`p${i}`} text={p} />
          ))}
        </Section>
      )}

      {report.wentWell.length > 0 && (
        <Section label="Det som holdt">
          {report.wentWell.map((w, i) => (
            <Paragraph key={`w${i}`} text={w} />
          ))}
        </Section>
      )}

      {report.suggestions.length > 0 && (
        <Section label={report.suggestions.length === 1 ? 'Forslag' : 'Forslag til neste uke'}>
          {report.suggestions.map((s, i) => (
            <SuggestionCard key={`s${i}`} suggestion={s} />
          ))}
        </Section>
      )}
    </View>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel} accessibilityRole="header">
        {label}
      </Text>
      {children}
    </View>
  );
}

// The first sentence carries the point, so it is bold; the rest explains it.
function Paragraph({ text }: { text: string }) {
  const match = /^(.+?[.!?])\s+([\s\S]+)$/.exec(text.trim());
  return (
    <Text style={styles.paragraph}>
      <Text style={styles.strong}>{match ? match[1] : text}</Text>
      {match ? ` ${match[2]}` : null}
    </Text>
  );
}

type Answer = { kind: 'open' } | { kind: 'saving' } | { kind: 'yes'; calendarUrl: string | null } | { kind: 'no' } | { kind: 'error' };

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const [answer, setAnswer] = useState<Answer>({ kind: 'open' });

  async function accept() {
    if (!suggestion.goalId || !suggestion.change) {
      setAnswer({ kind: 'yes', calendarUrl: null });
      return;
    }
    setAnswer({ kind: 'saving' });
    try {
      const result = await api.applySuggestion(suggestion.goalId, suggestion.change);
      setAnswer({ kind: 'yes', calendarUrl: result.calendarUrl });
    } catch {
      setAnswer({ kind: 'error' });
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardText}>{suggestion.text}</Text>

      {(answer.kind === 'open' || answer.kind === 'saving' || answer.kind === 'error') && (
        <>
          {answer.kind === 'error' && <Text style={styles.note}>Fikk ikke flyttet målet. Prøv igjen.</Text>}
          <ChoicePills
            yes="Ja, gjør det"
            no="Ikke nå"
            loading={answer.kind === 'saving'}
            onYes={accept}
            onNo={() => setAnswer({ kind: 'no' })}
          />
        </>
      )}

      {answer.kind === 'yes' && (
        <>
          <Text style={styles.note}>Avtalt. Målet er flyttet.</Text>
          {answer.calendarUrl && (
            <Button
              tone="dawn"
              variant="tonal"
              label="Legg i kalenderen"
              icon="calendar.badge.plus"
              onPress={() => Linking.openURL(answer.calendarUrl ?? '')}
              fill
            />
          )}
        </>
      )}

      {answer.kind === 'no' && <Text style={styles.note}>Greit. Vi lar det være som det er.</Text>}
    </View>
  );
}

// The weekly target with a buffer, said kindly: "5 av 7 dager på minst 7 · Ukemål nådd".
function targetLine(report: WeeklyReport): string {
  const { daysAtTarget, daysReviewed, targetDays, targetScore, targetMet } = report;
  if (targetMet) return `${daysAtTarget} av ${daysReviewed} dager på minst ${targetScore} · Ukemål nådd`;
  const left = targetDays - daysAtTarget;
  const close = left === 1 ? 'Nesten' : 'Ny uke, nye muligheter';
  return `${daysAtTarget} av ${targetDays} dager på minst ${targetScore} · ${close}`;
}

// One bar per day of the report week; the heaviest day gets the dashed ring.
function weekHero(stats: Stats, dates: string[]) {
  const days = dates.map((date) => stats.days.find((d) => d.date === date) ?? null);
  const done = days.reduce((n, d) => n + (d?.done ?? 0), 0);
  const partial = days.reduce((n, d) => n + (d?.partial ?? 0), 0);
  const total = days.reduce((n, d) => n + (d?.total ?? 0), 0);
  if (total === 0) return null;

  const rated = days.filter((d) => d?.rate !== null && d?.rate !== undefined).map((d) => d?.rate ?? 0);
  const lowest = rated.length > 1 && Math.min(...rated) < Math.max(...rated) ? Math.min(...rated) : null;
  let markedOnce = false;
  const bars: Bar[] = dates.map((date, i) => {
    const rate = days[i]?.rate ?? null;
    const marked = !markedOnce && lowest !== null && rate === lowest;
    if (marked) markedOnce = true;
    return { key: date, label: weekdayLetter[weekdayOf(date)], rate, marked };
  });

  return { rate: (done + partial / 2) / total, done, total, bars };
}

// Up to four goals: how many times it held, and the reason heard most often when it did not.
function goalCards(logs: DailyLog[], dates: string[]) {
  const inWeek = new Set(dates);
  const goals = new Map<string, { title: string; done: number; total: number; reasons: Map<string, number> }>();
  for (const log of logs) {
    if (!inWeek.has(log.date)) continue;
    for (const e of log.entries) {
      const g = goals.get(e.goalId) ?? { title: e.goalTitle, done: 0, total: 0, reasons: new Map<string, number>() };
      g.total += 1;
      if (e.status === 'done') g.done += 1;
      else if (e.reason) {
        const reason = e.reason.charAt(0).toLowerCase() + e.reason.slice(1);
        g.reasons.set(reason, (g.reasons.get(reason) ?? 0) + 1);
      }
      goals.set(e.goalId, g);
    }
  }
  return [...goals.values()].slice(0, 4).map((g) => {
    const [top] = [...g.reasons.entries()].sort((a, b) => b[1] - a[1]);
    const note = g.done === g.total ? 'holdt hver gang' : (top?.[0] ?? null);
    return { title: g.title, done: g.done, total: g.total, note };
  });
}

const styles = StyleSheet.create({
  content: { paddingBottom: space.xl, gap: space.lg },
  header: { gap: 2 },
  caption: { ...type.caption, ...type.strong, color: palette.textMuted },
  quiet: { gap: space.md, alignItems: 'flex-start', paddingTop: space.sm },
  muted: { ...type.body, color: palette.textMuted },
  sections: { gap: space.lg },
  target: { gap: space.md },
  targetText: { ...type.body, ...type.strong, color: palette.heroText },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm + 4 },
  section: { gap: space.sm + 4 },
  sectionLabel: { ...type.caption, ...type.strong, color: palette.textMuted },
  paragraph: { ...type.body, lineHeight: 24, color: palette.text },
  strong: { fontWeight: '700' },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg - 4, padding: space.md + 2, gap: space.md - 2 },
  cardText: { ...type.body, lineHeight: 24, ...type.strong, color: palette.text },
  note: { ...type.body, color: palette.textMuted },
});
