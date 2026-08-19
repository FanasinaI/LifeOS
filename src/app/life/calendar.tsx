import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, TextField } from '@/components/money/form-kit';
import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { createEvent, listUpcoming } from '@/modules/calendar';
import { addDays } from '@/utils/date';
import { formatDate } from '@/utils/format';
import { useAsyncData } from '@/utils/use-async-data';

export default function CalendarScreen() {
  const { data: events, loading, reload } = useAsyncData(() => listUpcoming(30), []);

  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const start = new Date();
      await createEvent({ title: title.trim(), startAt: start, endAt: addDays(start, 0) });
      setTitle('');
      reload();
    } finally {
      setCreating(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={events ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <SummaryRow title={item.title} subtitle={item.location ?? undefined} value={formatDate(item.startAt)} />
        )}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !loading ? (
            <ThemedText themeColor="textSecondary">Aucun événement dans les 30 prochains jours.</ThemedText>
          ) : null
        }
        ListFooterComponent={
          <ThemedView style={styles.addRow}>
            <ThemedText type="smallBold">Nouvel événement (aujourd&apos;hui)</ThemedText>
            <TextField value={title} onChangeText={setTitle} placeholder="Titre" />
            <PrimaryButton label="Ajouter" onPress={handleCreate} disabled={creating} />
          </ThemedView>
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
  separator: {
    height: Spacing.two,
  },
  addRow: {
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
});
