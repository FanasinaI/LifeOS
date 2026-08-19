import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, TextField } from '@/components/money/form-kit';
import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { chatWithContext, type ChatResult } from '@/ai/orchestrator';
import { listModels } from '@/ai/runtime';
import { createNote, listNotes } from '@/modules/notes';
import { formatDate } from '@/utils/format';
import { useAsyncData } from '@/utils/use-async-data';

export default function AiScreen() {
  const { data: models } = useAsyncData(() => listModels(), []);
  const { data: recentNotes, loading: notesLoading, reload: reloadNotes } = useAsyncData(
    () => listNotes(10),
    []
  );

  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ChatResult | null>(null);
  const [searching, setSearching] = useState(false);

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const hasActiveModel = (models ?? []).some((m) => m.isActive && m.isInstalled);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      setResult(await chatWithContext(query.trim()));
    } finally {
      setSearching(false);
    }
  }

  async function handleAddNote() {
    if (!noteTitle.trim() || !noteContent.trim()) return;
    setSavingNote(true);
    try {
      await createNote({ title: noteTitle.trim(), content: noteContent.trim() });
      setNoteTitle('');
      setNoteContent('');
      reloadNotes();
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={recentNotes ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ThemedView style={styles.header}>
            <ThemedText type="title">IA locale</ThemedText>

            <ThemedView type="backgroundElement" style={styles.statusCard}>
              <ThemedText type="small" themeColor={hasActiveModel ? 'success' : 'textSecondary'}>
                {hasActiveModel
                  ? 'Modèle actif'
                  : "Aucun modèle installé — la recherche locale fonctionne quand même"}
              </ThemedText>
              <PrimaryButton label="Gérer la mémoire IA" onPress={() => router.push('/ai/memory')} />
            </ThemedView>

            <TextField value={query} onChangeText={setQuery} placeholder="Cherche dans tes notes…" />
            <PrimaryButton
              label={searching ? 'Recherche…' : 'Rechercher'}
              onPress={handleSearch}
              disabled={searching}
            />
            {result ? (
              <ThemedView type="backgroundElement" style={styles.resultCard}>
                <ThemedText type="small">{result.answer}</ThemedText>
              </ThemedView>
            ) : null}

            <ThemedText type="smallBold">Notes récentes</ThemedText>
          </ThemedView>
        }
        renderItem={({ item }) => (
          <SummaryRow title={item.title} subtitle={item.content} value={formatDate(item.updatedAt)} />
        )}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !notesLoading ? <ThemedText themeColor="textSecondary">Aucune note pour l&apos;instant.</ThemedText> : null
        }
        ListFooterComponent={
          <ThemedView style={styles.addRow}>
            <ThemedText type="smallBold">Nouvelle note</ThemedText>
            <TextField value={noteTitle} onChangeText={setNoteTitle} placeholder="Titre" />
            <TextField value={noteContent} onChangeText={setNoteContent} placeholder="Contenu" multiline />
            <PrimaryButton label="Enregistrer" onPress={handleAddNote} disabled={savingNote} />
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
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  statusCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  resultCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  separator: {
    height: Spacing.two,
  },
  addRow: {
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
});
