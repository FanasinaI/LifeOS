import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, TextField } from '@/components/money/form-kit';
import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { computeNetWorth, createAsset, listAssetsWithValues } from '@/modules/patrimoine';
import { formatMoney } from '@/utils/format';
import { useAsyncData } from '@/utils/use-async-data';

const PRIMARY_CURRENCY = 'MGA';

export default function PatrimoineScreen() {
  const theme = useTheme();
  const { data: assets, loading, reload } = useAsyncData(() => listAssetsWithValues(), []);
  const { data: netWorth, reload: reloadNetWorth } = useAsyncData(
    () => computeNetWorth(PRIMARY_CURRENCY),
    []
  );

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [initialValue, setInitialValue] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    const parsed = Number(initialValue.replace(',', '.'));
    if (!name.trim() || !category.trim() || !Number.isFinite(parsed) || parsed <= 0) return;
    setCreating(true);
    try {
      await createAsset({
        name: name.trim(),
        category: category.trim(),
        initialValue: parsed,
        currency: PRIMARY_CURRENCY,
        acquisitionDate: new Date(),
      });
      setName('');
      setCategory('');
      setInitialValue('');
      reload();
      reloadNetWorth();
    } finally {
      setCreating(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={assets ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ThemedView style={styles.header}>
            <ThemedView type="backgroundElement" style={styles.netWorthCard}>
              <ThemedText type="small" themeColor="textSecondary">
                Patrimoine net (actifs − dettes)
              </ThemedText>
              <ThemedText
                type="subtitle"
                style={netWorth && netWorth.netWorth < 0 ? { color: theme.danger } : undefined}>
                {netWorth ? formatMoney(netWorth.netWorth, netWorth.currency) : '…'}
              </ThemedText>
              {netWorth ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Actifs {formatMoney(netWorth.totalAssets, netWorth.currency)} · Dettes{' '}
                  {formatMoney(netWorth.totalDebts, netWorth.currency)}
                </ThemedText>
              ) : null}
            </ThemedView>
            <ThemedText type="smallBold">Possessions</ThemedText>
          </ThemedView>
        }
        renderItem={({ item }) => (
          <SummaryRow title={item.name} subtitle={item.category} value={formatMoney(item.currentValue, item.currency)} />
        )}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !loading ? <ThemedText themeColor="textSecondary">Aucune possession enregistrée.</ThemedText> : null
        }
        ListFooterComponent={
          <ThemedView style={styles.addRow}>
            <ThemedText type="smallBold">Nouvelle possession</ThemedText>
            <TextField value={name} onChangeText={setName} placeholder="Nom (ex: PC portable)" />
            <TextField value={category} onChangeText={setCategory} placeholder="Catégorie (ex: électronique)" />
            <TextField
              value={initialValue}
              onChangeText={setInitialValue}
              placeholder="Valeur d'achat"
              keyboardType="decimal-pad"
            />
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
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  netWorthCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  separator: {
    height: Spacing.two,
  },
  addRow: {
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
});
