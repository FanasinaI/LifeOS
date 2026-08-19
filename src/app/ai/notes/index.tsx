import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, TextField } from '@/components/money/form-kit';
import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { listNotes, searchNotes } from '@/modules/notes';
import { formatDate } from '@/utils/format';
import { useAsyncData } from '@/utils/use-async-data';

export default function NotesListScreen() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Awaited<ReturnType<typeof listNotes>> | null>(null);
  const [searching, setSearching] = useState(false);

  const { data: allNotes, loading, reload } = useAsyncData(() => listNotes(), []);

  async function handleSearch() {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      setSearchResults(await searchNotes(query.trim()));
    } finally {
      setSearching(false);
    }
  }

  function handleClear() {
    setQuery('');
    setSearchResults(null);
  }

  const notesToShow = searchResults ?? allNotes ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={notesToShow}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ThemedView style={styles.header}>
            <TextField
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher dans les notes…"
              onSubmitEditing={handleSearch}
            />
            <ThemedView style={styles.searchRow}>
              <PrimaryButton label={searching ? '…' : 'Rechercher'} onPress={handleSearch} disabled={searching} />
              {searchResults ? <PrimaryButton label="Effacer" onPress={handleClear} /> : null}
            </ThemedView>
          </ThemedView>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/ai/notes/${item.id}`)}>
            <SummaryRow title={item.title} subtitle={item.content} value={formatDate(item.updatedAt)} />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !loading && !searching ? (
            <ThemedText themeColor="textSecondary">
              {searchResults ? 'Aucun résultat.' : 'Aucune note pour l’instant.'}
            </ThemedText>
          ) : null
        }
        onRefresh={reload}
        refreshing={loading}
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
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  separator: {
    height: Spacing.two,
  },
});
