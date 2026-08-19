import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, type ColorValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/money/form-kit';
import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listUnreadInsights, markInsightRead, type Insight } from '@/intelligence/insights';
import { computeLifeScore } from '@/intelligence/life-score';
import { runOodaCycle } from '@/intelligence/ooda';
import { useAsyncData } from '@/utils/use-async-data';

function severityColor(severity: Insight['severity'], theme: ReturnType<typeof useTheme>): ColorValue {
  switch (severity) {
    case 'critique':
      return theme.danger;
    case 'important':
    case 'attention':
      return theme.warning;
    default:
      return theme.textSecondary;
  }
}

export default function DashboardScreen() {
  const theme = useTheme();
  const { data: lifeScore, loading: scoreLoading, reload: reloadScore } = useAsyncData(
    () => computeLifeScore(),
    []
  );
  const { data: insights, loading: insightsLoading, reload: reloadInsights } = useAsyncData(
    () => listUnreadInsights(),
    []
  );
  const [running, setRunning] = useState(false);

  async function handleRunCycle() {
    setRunning(true);
    try {
      await runOodaCycle();
      reloadScore();
      reloadInsights();
    } finally {
      setRunning(false);
    }
  }

  async function handleDismiss(insightId: number) {
    await markInsightRead(insightId);
    reloadInsights();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={insights ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ThemedView style={styles.header}>
            <ThemedText type="title">LifeOS</ThemedText>

            <ThemedView type="backgroundElement" style={styles.scoreCard}>
              <ThemedText type="small" themeColor="textSecondary">
                Life Score
              </ThemedText>
              <ThemedText type="title">{scoreLoading ? '…' : lifeScore?.score}</ThemedText>
              {(lifeScore?.components ?? []).map((c) => (
                <ThemedText key={c.key} type="small" themeColor="textSecondary">
                  {c.label} : {Math.round(c.value)} — {c.explanation}
                </ThemedText>
              ))}
            </ThemedView>

            <PrimaryButton
              label={running ? 'Analyse en cours…' : 'Lancer un cycle OODA'}
              onPress={handleRunCycle}
              disabled={running}
            />

            <ThemedText type="smallBold">Alertes</ThemedText>
          </ThemedView>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => handleDismiss(item.id)}>
            <SummaryRow
              title={item.title}
              subtitle={item.message}
              value={item.severity}
              valueColor={severityColor(item.severity, theme)}
            />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !insightsLoading ? (
            <ThemedText themeColor="textSecondary">
              Aucune alerte — lance un cycle OODA pour analyser ta situation.
            </ThemedText>
          ) : null
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
  scoreCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  separator: {
    height: Spacing.two,
  },
});
