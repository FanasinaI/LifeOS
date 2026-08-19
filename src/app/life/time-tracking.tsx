import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, ChipRow, PrimaryButton, TextField } from '@/components/money/form-kit';
import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import {
  findActiveSession,
  listRecentSessions,
  startSession,
  stopSession,
  type TimeCategory,
} from '@/modules/time-tracking';
import { formatDate } from '@/utils/format';
import { useAsyncData } from '@/utils/use-async-data';

const CATEGORIES: { value: TimeCategory; label: string }[] = [
  { value: 'work', label: 'Travail' },
  { value: 'study', label: 'Étude' },
  { value: 'sport', label: 'Sport' },
  { value: 'leisure', label: 'Loisirs' },
];

export default function TimeTrackingScreen() {
  const { data: active, reload: reloadActive } = useAsyncData(() => findActiveSession(), []);
  const { data: sessions, loading, reload: reloadSessions } = useAsyncData(() => listRecentSessions(), []);

  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<TimeCategory>('work');
  const [busy, setBusy] = useState(false);

  function reloadAll() {
    reloadActive();
    reloadSessions();
  }

  async function handleStart() {
    if (!label.trim()) return;
    setBusy(true);
    try {
      await startSession(label.trim(), category);
      setLabel('');
      reloadAll();
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    if (!active) return;
    setBusy(true);
    try {
      await stopSession(active.id);
      reloadAll();
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={sessions ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ThemedView style={styles.header}>
            {active ? (
              <ThemedView type="backgroundElement" style={styles.activeCard}>
                <ThemedText type="smallBold">{active.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  En cours depuis {formatDate(active.startAt)}
                </ThemedText>
                <PrimaryButton label="Arrêter" onPress={handleStop} disabled={busy} />
              </ThemedView>
            ) : (
              <ThemedView style={styles.addRow}>
                <ChipRow>
                  {CATEGORIES.map((c) => (
                    <Chip key={c.value} label={c.label} selected={category === c.value} onPress={() => setCategory(c.value)} />
                  ))}
                </ChipRow>
                <TextField value={label} onChangeText={setLabel} placeholder="Que fais-tu ?" />
                <PrimaryButton label="Démarrer" onPress={handleStart} disabled={busy} />
              </ThemedView>
            )}

            <ThemedText type="smallBold">Sessions récentes</ThemedText>
          </ThemedView>
        }
        renderItem={({ item }) => (
          <SummaryRow
            title={item.label}
            subtitle={CATEGORIES.find((c) => c.value === item.category)?.label}
            value={item.actualMinutes != null ? `${item.actualMinutes} min` : 'en cours'}
          />
        )}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !loading ? <ThemedText themeColor="textSecondary">Aucune session enregistrée.</ThemedText> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  list: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.two,
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  activeCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  addRow: {
    gap: Spacing.two,
  },
  separator: {
    height: Spacing.two,
  },
});
