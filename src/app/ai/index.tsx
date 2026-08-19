import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, TextField } from '@/components/money/form-kit';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { chatWithContext, type ChatResult } from '@/ai/orchestrator';
import { listModels } from '@/ai/runtime';
import { createNote } from '@/modules/notes';
import { useAsyncData } from '@/utils/use-async-data';

export default function AiScreen() {
  const { data: models } = useAsyncData(() => listModels(), []);

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
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title">IA locale</ThemedText>

        <ThemedView type="backgroundElement" style={styles.statusCard}>
          <ThemedText type="small" themeColor={hasActiveModel ? 'success' : 'textSecondary'}>
            {hasActiveModel
              ? 'Modèle actif'
              : "Aucun modèle installé — la recherche locale fonctionne quand même"}
          </ThemedText>
          <PrimaryButton label="Gérer la mémoire IA" onPress={() => router.push('/ai/memory')} />
          <PrimaryButton label="Voir toutes mes notes" onPress={() => router.push('/ai/notes')} />
          <PrimaryButton label="Journal d'audit" onPress={() => router.push('/ai/audit')} />
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

        <ThemedView style={styles.addRow}>
          <ThemedText type="smallBold">Nouvelle note</ThemedText>
          <TextField value={noteTitle} onChangeText={setNoteTitle} placeholder="Titre" />
          <TextField value={noteContent} onChangeText={setNoteContent} placeholder="Contenu" multiline />
          <PrimaryButton label="Enregistrer" onPress={handleAddNote} disabled={savingNote} />
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: Spacing.three,
    gap: Spacing.three,
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
  addRow: {
    gap: Spacing.two,
  },
});
