import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, TextField } from '@/components/money/form-kit';
import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  createBudget,
  createCategory,
  listBudgetStatuses,
  listCategories,
  type BudgetStatus,
} from '@/modules/finance';
import { endOfMonth, startOfMonth } from '@/utils/date';
import { formatMoney, formatPercent } from '@/utils/format';
import { useAsyncData } from '@/utils/use-async-data';

export default function BudgetsScreen() {
  const theme = useTheme();
  const { data: statuses, loading, reload } = useAsyncData(() => listBudgetStatuses(), []);
  const { data: categories, reload: reloadCategories } = useAsyncData(
    () => listCategories('expense'),
    []
  );
  const [categoryName, setCategoryName] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const parsedAmount = Number(amount.replace(',', '.'));
    if (!categoryName.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    setSaving(true);
    try {
      const existing = categories?.find(
        (c) => c.name.toLowerCase() === categoryName.trim().toLowerCase()
      );
      const category = existing ?? (await createCategory({ name: categoryName.trim(), kind: 'expense' }));

      const now = new Date();
      await createBudget({
        categoryId: category.id,
        period: 'monthly',
        periodStart: startOfMonth(now),
        periodEnd: endOfMonth(now),
        amount: parsedAmount,
      });

      setCategoryName('');
      setAmount('');
      reload();
      reloadCategories();
    } finally {
      setSaving(false);
    }
  }

  function categoryLabel(status: BudgetStatus): string {
    return categories?.find((c) => c.id === status.budget.categoryId)?.name ?? 'Catégorie';
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={statuses ?? []}
        keyExtractor={(item) => String(item.budget.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <SummaryRow
            title={categoryLabel(item)}
            subtitle={`${formatPercent(item.percentUsed)} utilisé · reste ${formatMoney(item.remaining, 'MGA')}`}
            value={formatMoney(item.consumed, 'MGA')}
            valueColor={item.isOverBudget ? theme.danger : undefined}
          />
        )}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !loading ? <ThemedText themeColor="textSecondary">Aucun budget pour l&apos;instant.</ThemedText> : null
        }
        ListFooterComponent={
          <ThemedView style={styles.addRow}>
            <ThemedText type="smallBold">Nouveau budget mensuel</ThemedText>
            <TextField value={categoryName} onChangeText={setCategoryName} placeholder="Catégorie" />
            <TextField value={amount} onChangeText={setAmount} placeholder="Montant" keyboardType="decimal-pad" />
            <PrimaryButton label="Créer le budget" onPress={handleCreate} disabled={saving} />
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
