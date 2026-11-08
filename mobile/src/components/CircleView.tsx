import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { Segmented } from '@/components/Segmented';
import { circleStandings, cheers, myCircle, type CircleStanding, type Member } from '@/lib/circles';
import { formatScore } from '@/lib/days';
import { palettes, radius, space, type } from '@/theme';

const palette = palettes.dawn;

type View_ = 'circle' | 'others';

// DEMO: friend circles. A weekly leaderboard inside your circle, and your circle against others.
// Competition is on the week's day scores only; reasons and what you said are never shared.
export function CircleView() {
  const router = useRouter();
  const [view, setView] = useState<View_>('circle');
  const [cheer, setCheer] = useState<string | null>(null);

  const members = [...myCircle.members].sort((a, b) => b.score - a.score);
  const standings = [...circleStandings].sort((a, b) => b.score - a.score);
  const place = standings.findIndex((c) => c.yours) + 1;
  const ours = standings.find((c) => c.yours);

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.heroEyebrow}>
            {myCircle.name} · {myCircle.members.length} venner
          </Text>
          <View style={styles.faces}>
            {myCircle.members.map((m, i) => (
              <View key={m.id} style={[styles.face, i > 0 && styles.faceOverlap, m.you && styles.faceYou]}>
                <Text style={[styles.faceText, m.you && styles.faceTextYou]}>{m.initials}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.heroNumber} accessible accessibilityLabel={`Plass ${place} av ${standings.length} sirkler`}>
          <Text style={styles.bigNumber}>{place}.</Text>
          <Text style={styles.bigLabel}>plass av {standings.length} sirkler</Text>
        </View>
        <Text style={styles.heroLine}>
          {ours && ours.move > 0 ? `Opp ${ours.move} plasser siden forrige uke. ` : ''}
          {myCircle.daysLeft} dager igjen av uke {myCircle.week}.
        </Text>
      </View>

      <Segmented
        options={[
          { value: 'circle', label: 'I sirkelen' },
          { value: 'others', label: 'Mot andre sirkler' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'circle' ? (
        <View style={styles.list}>
          {members.map((m, i) => (
            <MemberRow key={m.id} member={m} rank={i + 1} last={i === members.length - 1} />
          ))}
        </View>
      ) : (
        <View style={styles.list}>
          {standings.map((c, i) => (
            <CircleRow key={c.id} circle={c} rank={i + 1} last={i === standings.length - 1} />
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>Send et heiarop til sirkelen</Text>
        <View style={styles.chips}>
          {cheers.map((c) => (
            <Chip key={c} label={c} selected={cheer === c} onPress={() => setCheer(c)} />
          ))}
        </View>
        {cheer && <Text style={styles.note}>«{cheer}» er sendt til {myCircle.name}.</Text>}
      </View>

      <View style={styles.actions}>
        <Button tone="dawn" variant="tonal" label="Inviter venner" icon="plus" onPress={() => router.push('/circle-invite')} fill />
      </View>

      <Text style={styles.footnote}>
        Sirkelen ser bare hvor mange kvelder du har gjort og dagspoengene dine. Aldri hva du sa.
      </Text>
    </View>
  );
}

function MemberRow({ member, rank, last }: { member: Member; rank: number; last: boolean }) {
  return (
    <View
      style={[styles.row, member.you && styles.rowYou, !last && styles.divider]}
      accessible
      accessibilityLabel={`${rank}. ${member.name}, ${formatScore(member.score)} i snitt, ${member.evenings} av 7 kvelder`}
    >
      <Text style={[styles.rank, rank === 1 && styles.rankFirst]}>{rank}</Text>
      <View style={[styles.avatar, member.you && styles.avatarYou]}>
        <Text style={[styles.avatarText, member.you && styles.avatarTextYou]}>{member.initials}</Text>
      </View>
      <View style={styles.who}>
        <Text style={styles.name}>{member.name}</Text>
        <View style={styles.meta}>
          <Text style={styles.detail}>{member.evenings} av 7 kvelder</Text>
          {member.doneToday && (
            <View style={styles.today}>
              <Icon name="checkmark" color={palette.textMuted} size={10} />
              <Text style={styles.detail}>i dag</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.score}>{formatScore(member.score)}</Text>
    </View>
  );
}

function CircleRow({ circle, rank, last }: { circle: CircleStanding; rank: number; last: boolean }) {
  const move = circle.move > 0 ? `▲ ${circle.move}` : circle.move < 0 ? `▼ ${-circle.move}` : '–';
  return (
    <View
      style={[styles.row, circle.yours && styles.rowYou, !last && styles.divider]}
      accessible
      accessibilityLabel={`${rank}. ${circle.name}, ${formatScore(circle.score)} i snitt`}
    >
      <Text style={[styles.rank, rank === 1 && styles.rankFirst]}>{rank}</Text>
      <View style={styles.who}>
        <Text style={styles.name}>
          {circle.name}
          {circle.yours ? ' · dere' : ''}
        </Text>
        <Text style={styles.detail}>{circle.members} venner</Text>
      </View>
      <Text style={styles.move}>{move}</Text>
      <Text style={styles.score}>{formatScore(circle.score)}</Text>
    </View>
  );
}

const FACE = 30;
const AVATAR = 36;

const styles = StyleSheet.create({
  wrap: { gap: space.lg },
  hero: { backgroundColor: palette.hero, borderRadius: radius.lg, padding: space.lg - 4, gap: space.md },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  heroEyebrow: { ...type.caption, fontSize: 15, ...type.strong, color: palette.heroMuted, flexShrink: 1 },
  faces: { flexDirection: 'row' },
  face: {
    width: FACE,
    height: FACE,
    borderRadius: FACE / 2,
    backgroundColor: palette.heroTrack,
    borderWidth: 2,
    borderColor: palette.hero,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceOverlap: { marginLeft: -8 },
  faceYou: { backgroundColor: palette.heroText },
  faceText: { fontSize: 10, fontWeight: '700', color: palette.heroText },
  faceTextYou: { color: palette.hero },
  heroNumber: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  bigNumber: { fontSize: 56, lineHeight: 60, fontWeight: '800', letterSpacing: -2, color: palette.heroText },
  bigLabel: { ...type.body, ...type.strong, color: palette.heroMuted },
  heroLine: { ...type.body, fontSize: 15, color: palette.heroMuted },
  list: { backgroundColor: palette.surface, borderRadius: radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm + 4, paddingHorizontal: space.md, minHeight: 62 },
  rowYou: { backgroundColor: palette.tonal },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.line },
  rank: { width: 18, ...type.body, ...type.strong, color: palette.textMuted, textAlign: 'center', fontVariant: ['tabular-nums'] },
  rankFirst: { color: palette.text },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: palette.tonal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarYou: { backgroundColor: palette.action },
  avatarText: { fontSize: 12, fontWeight: '700', color: palette.text },
  avatarTextYou: { color: palette.actionText },
  who: { flex: 1, gap: 2, paddingVertical: space.sm + 2 },
  name: { ...type.body, ...type.strong, color: palette.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  today: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  detail: { ...type.caption, fontWeight: '400', color: palette.textMuted },
  move: { ...type.caption, ...type.strong, color: palette.textMuted, minWidth: 30, textAlign: 'right' },
  score: { fontSize: 22, lineHeight: 26, fontWeight: '800', letterSpacing: -0.5, color: palette.text, minWidth: 40, textAlign: 'right' },
  section: { gap: space.sm + 4 },
  label: { ...type.caption, ...type.strong, color: palette.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  note: { ...type.caption, color: palette.textMuted },
  actions: { gap: space.sm },
  footnote: { ...type.caption, fontWeight: '400', color: palette.textMuted, textAlign: 'center', paddingHorizontal: space.md },
});
