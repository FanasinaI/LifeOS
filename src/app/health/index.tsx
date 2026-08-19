import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, ChipRow } from '@/components/money/form-kit';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { computeDailyStatus, logWater } from '@/modules/hydration';
import { computeDailyMacros } from '@/modules/nutrition';
import { formatPercent } from '@/utils/format';
import { useAsyncData } from '@/utils/use-async-data';

const QUICK_AMOUNTS_ML = [150, 250, 500];

export default function HealthScreen() {
  const { data: hydration, reload: reloadHydration } = useAsyncData(() => computeDailyStatus(), []);
  const { data: macros } = useAsyncData(() => computeDailyMacros(), []);

  async function handleAddWater(amountMl: number) {
    await logWater(amountMl);
    reloadHydration();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Santé</ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="small" themeColor="textSecondary">
            Hydratation
          </ThemedText>
          <ThemedText type="subtitle">
            {hydration ? `${Math.round(hydration.consumedMl)} / ${hydration.goalMl} ml` : '…'}
          </ThemedText>
          {hydration ? (
            <ThemedText type="small" themeColor={hydration.percent >= 1 ? 'success' : 'textSecondary'}>
              {formatPercent(hydration.percent)} de l&apos;objectif
            </ThemedText>
          ) : null}
          <ChipRow>
            {QUICK_AMOUNTS_ML.map((ml) => (
              <Chip key={ml} label={`+${ml} ml`} selected={false} onPress={() => handleAddWater(ml)} />
            ))}
          </ChipRow>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="small" themeColor="textSecondary">
            Nutrition (aujourd&apos;hui)
          </ThemedText>
          <ThemedText type="subtitle">{macros ? `${Math.round(macros.calories)} kcal` : '…'}</ThemedText>
          {macros ? (
            <ThemedText type="small" themeColor="textSecondary">
              P {Math.round(macros.protein)}g · G {Math.round(macros.carbs)}g · L {Math.round(macros.fat)}g
            </ThemedText>
          ) : null}
        </ThemedView>

        <ChipRow>
          <Chip label="Sport" selected={false} onPress={() => router.push('/health/sport')} />
          <Chip label="Nutrition" selected={false} onPress={() => router.push('/health/nutrition')} />
        </ChipRow>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
});
