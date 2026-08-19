import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, ChipRow, PrimaryButton, TextField } from '@/components/money/form-kit';
import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import {
  computeRequiredPace,
  contributeToGoal,
  createGoal,
  listGoals,
  progressPercent,
  type Goal,
} from '@/modules/goals';
import { formatMoney, formatPercent } from '@/utils/format';
import { useAsyncData } from '@/utils/use-async-data';

const DOMAINS: { value: Goal['domain']; label: string }[] = [
  { value: 'financial', label: 'Financier' },
  { value: 'school', label: 'Scolaire' },
  { value: 'professional', label: 'Professionnel' },
  { value: 'sport', label: 'Sport' },
  { value: 'personal', label: 'Personnel' },
  { value: 'material', label: 'Matériel' },
];

export default function GoalsScreen() {
  const { data: goals, loading, reload } = useAsyncData(() => listGoals('active'), []);

  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<Goal['domain']>('personal');
  const [targetAmount, setTargetAmount] = useState('');
  const [creating, setCreating] = useState(false);

  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  async function handleCreate() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const parsedTarget = Number(targetAmount.replace(',', '.'));
      await createGoal({
        title: title.trim(),
        domain,
        targetAmount: Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : null,
      });
      setTitle('');
      setTargetAmount('');
      reload();
    } finally {
      setCreating(false);
    }
  }

  async function handleContribute() {
    const parsed = Number(contributionAmount.replace(',', '.'));
    if (!selectedGoalId || !Number.isFinite(parsed) || parsed <= 0) return;
    setContributing(true);
    try {
      await contributeToGoal(selectedGoalId, parsed);
      setContributionAmount('');
      setSelectedGoalId(null);
      reload();
    } finally {
      setContributing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={goals ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const pace = computeRequiredPace(item);
          const subtitleParts = [`${formatPercent(progressPercent(item))} atteint`];
          if (pace) subtitleParts.push(`${formatMoney(pace.perDay, item.currency)}/jour requis`);
          return (
            <SummaryRow
              title={item.title}
              subtitle={subtitleParts.join(' · ')}
              value={item.targetAmount ? formatMoney(item.currentAmount, item.currency) : '—'}
            />
          );
        }}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !loading ? <ThemedText themeColor="textSecondary">Aucun objectif actif.</ThemedText> : null
        }
        ListFooterComponent={
          <ThemedView style={styles.footer}>
            {(goals?.length ?? 0) > 0 ? (
              <ThemedView style={styles.addRow}>
                <ThemedText type="smallBold">Ajouter une contribution</ThemedText>
                <ChipRow>
                  {(goals ?? []).map((g) => (
                    <Chip
                      key={g.id}
                      label={g.title}
                      selected={selectedGoalId === g.id}
                      onPress={() => setSelectedGoalId(g.id)}
                    />
                  ))}
                </ChipRow>
                <TextField
                  value={contributionAmount}
                  onChangeText={setContributionAmount}
                  placeholder="Montant"
                  keyboardType="decimal-pad"
                />
                <PrimaryButton label="Contribuer" onPress={handleContribute} disabled={contributing} />
              </ThemedView>
            ) : null}

            <ThemedView style={styles.addRow}>
              <ThemedText type="smallBold">Nouvel objectif</ThemedText>
              <ChipRow>
                {DOMAINS.map((d) => (
                  <Chip key={d.value} label={d.label} selected={domain === d.value} onPress={() => setDomain(d.value)} />
                ))}
              </ChipRow>
              <TextField value={title} onChangeText={setTitle} placeholder="Titre" />
              <TextField
                value={targetAmount}
                onChangeText={setTargetAmount}
                placeholder="Montant cible (optionnel)"
                keyboardType="decimal-pad"
              />
              <PrimaryButton label="Créer l'objectif" onPress={handleCreate} disabled={creating} />
            </ThemedView>
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
  footer: {
    marginTop: Spacing.four,
    gap: Spacing.five,
  },
  addRow: {
    gap: Spacing.two,
  },
});
