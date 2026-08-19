import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, TextField } from '@/components/money/form-kit';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { deleteNote, getNote, updateNote, type Note } from '@/modules/notes';
import { useAsyncData } from '@/utils/use-async-data';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const noteId = Number(id);

  const { data: note, loading } = useAsyncData(() => getNote(noteId), [noteId]);

  if (loading || !note) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ThemedText themeColor="textSecondary" style={styles.loading}>
          {loading ? 'Chargement…' : 'Note introuvable.'}
        </ThemedText>
      </SafeAreaView>
    );
  }

  // key={note.id} : remonte l'éditeur (donc réinitialise son état local) si l'id change, plutôt
  // que de synchroniser `note` dans l'état via un effet.
  return <NoteEditor key={note.id} noteId={note.id} note={note} />;
}

function NoteEditor({ noteId, note }: { noteId: number; note: Note }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await updateNote(noteId, { title: title.trim(), content: content.trim() });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await deleteNote(noteId);
    router.back();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <TextField value={title} onChangeText={setTitle} placeholder="Titre" />
        <TextField value={content} onChangeText={setContent} placeholder="Contenu" multiline style={styles.contentField} />
        <PrimaryButton label={saving ? 'Enregistrement…' : 'Enregistrer'} onPress={handleSave} disabled={saving} />
        <PrimaryButton label="Supprimer la note" onPress={handleDelete} />
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
  contentField: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
  loading: {
    padding: Spacing.four,
    textAlign: 'center',
  },
});
