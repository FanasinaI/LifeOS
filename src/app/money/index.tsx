import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, ChipRow, PrimaryButton, TextField } from '@/components/money/form-kit';
import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createAccount, listAccountsWithBalances, type AccountType } from '@/modules/finance';
import { formatMoney } from '@/utils/format';
import { useAsyncData } from '@/utils/use-async-data';

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'cash', label: 'Espèces' },
  { value: 'bank', label: 'Banque' },
  { value: 'mvola', label: 'Mvola' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'custom', label: 'Autre' },
];

const LINKS: { href: '/money/budgets' | '/money/debts' | '/money/receivables' | '/money/patrimoine'; label: string }[] = [
  { href: '/money/budgets', label: 'Budgets' },
  { href: '/money/debts', label: 'Dettes' },
  { href: '/money/receivables', label: 'Créances' },
  { href: '/money/patrimoine', label: 'Patrimoine' },
];

export default function MoneyScreen() {
  const theme = useTheme();
  const { data: accounts, loading, reload } = useAsyncData(() => listAccountsWithBalances(), []);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [creating, setCreating] = useState(false);

  const total = (accounts ?? []).reduce((sum, a) => sum + a.computedBalance, 0);
  const primaryCurrency = accounts?.[0]?.currency ?? 'MGA';

  async function handleCreateAccount() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createAccount({ name: name.trim(), type, currency: primaryCurrency });
      setName('');
      reload();
    } finally {
      setCreating(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={accounts ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ThemedView style={styles.header}>
            <ThemedText type="title">Argent</ThemedText>

            <ThemedView type="backgroundElement" style={styles.totalCard}>
              <ThemedText type="small" themeColor="textSecondary">
                Solde total
              </ThemedText>
              <ThemedText type="subtitle">{formatMoney(total, primaryCurrency)}</ThemedText>
            </ThemedView>

            <ChipRow>
              <Chip label="+ Transaction" selected onPress={() => router.push('/money/new-transaction')} />
              {LINKS.map((link) => (
                <Chip key={link.href} label={link.label} selected={false} onPress={() => router.push(link.href)} />
              ))}
            </ChipRow>

            <ThemedText type="smallBold">Comptes</ThemedText>
          </ThemedView>
        }
        renderItem={({ item }) => (
          <SummaryRow
            title={item.name}
            subtitle={ACCOUNT_TYPES.find((t) => t.value === item.type)?.label}
            value={formatMoney(item.computedBalance, item.currency)}
            valueColor={item.computedBalance < 0 ? theme.danger : undefined}
          />
        )}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !loading ? (
            <ThemedText themeColor="textSecondary">Aucun compte pour l&apos;instant.</ThemedText>
          ) : null
        }
        ListFooterComponent={
          <ThemedView style={styles.addRow}>
            <ChipRow>
              {ACCOUNT_TYPES.map((t) => (
                <Chip key={t.value} label={t.label} selected={type === t.value} onPress={() => setType(t.value)} />
              ))}
            </ChipRow>
            <TextField value={name} onChangeText={setName} placeholder="Nom du nouveau compte" />
            <PrimaryButton label="Ajouter le compte" onPress={handleCreateAccount} disabled={creating} />
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
  totalCard: {
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
