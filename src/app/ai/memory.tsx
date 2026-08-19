import { useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, ChipRow, PrimaryButton, TextField } from '@/components/money/form-kit';
import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { deleteMemory, listMemory, setMemory, type AiMemoryEntry } from '@/ai/memory';
import { useAsyncData } from '@/utils/use-async-data';

const KINDS: { value: AiMemoryEntry['kind']; label: string }[] = [
  { value: 'preference', label: 'Préférence' },
  { value: 'goal_context', label: 'Contexte objectif' },
  { value: 'decision', label: 'Décision' },
  { value: 'planning', label: 'Planning' },
];

export default function AiMemoryScreen() {
  const { data: memory, loading, reload } = useAsyncData(() => listMemory(), []);
  const [kind, setKind] = useState<AiMemoryEntry['kind']>('preference');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!key.trim() || !value.trim()) return;
    setSaving(true);
    try {
      await setMemory(kind, key.trim(), value.trim());
      setKey('');
      setValue('');
      reload();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteMemory(id);
    reload();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={memory ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable onPress={() => handleDelete(item.id)}>
            <SummaryRow title={item.key} subtitle={item.value} value="Supprimer" />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !loading ? <ThemedText themeColor="textSecondary">Aucune mémoire enregistrée.</ThemedText> : null
        }
        ListFooterComponent={
          <ThemedView style={styles.addRow}>
            <ThemedText type="smallBold">Nouvelle entrée</ThemedText>
            <ChipRow>
              {KINDS.map((k) => (
                <Chip key={k.value} label={k.label} selected={kind === k.value} onPress={() => setKind(k.value)} />
              ))}
            </ChipRow>
            <TextField value={key} onChangeText={setKey} placeholder="Clé (ex: devise_preferee)" />
            <TextField value={value} onChangeText={setValue} placeholder="Valeur" />
            <PrimaryButton label="Enregistrer" onPress={handleAdd} disabled={saving} />
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
