import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/Screen';

// One day: goal statuses, short report, "I morgen" box.
export default function LogDayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  return <Screen title={date ?? ''} />;
}
