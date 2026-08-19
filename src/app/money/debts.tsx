import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, ChipRow, PrimaryButton, TextField } from '@/components/money/form-kit';
import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createDebt, listOpenDebts, recordDebtPayment } from '@/modules/finance';
import { formatMoney } from '@/utils/format';
import { useAsyncData } from '@/utils/use-async-data';

export default function DebtsScreen() {
  const theme = useTheme();
  const { data: debts, loading, reload } = useAsyncData(() => listOpenDebts(), []);

  const [creditor, setCreditor] = useState('');
  const [principal, setPrincipal] = useState('');
  const [creating, setCreating] = useState(false);

  const [selectedDebtId, setSelectedDebtId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paying, setPaying] = useState(false);

  async function handleCreate() {
    const parsed = Number(principal.replace(',', '.'));
    if (!creditor.trim() || !Number.isFinite(parsed) || parsed <= 0) return;
    setCreating(true);
    try {
      await createDebt({ creditor: creditor.trim(), principal: parsed, currency: 'MGA' });
      setCreditor('');
      setPrincipal('');
      reload();
    } finally {
      setCreating(false);
    }
  }

  async function handlePay() {
    const parsed = Number(paymentAmount.replace(',', '.'));
    if (!selectedDebtId || !Number.isFinite(parsed) || parsed <= 0) return;
    setPaying(true);
    try {
      await recordDebtPayment(selectedDebtId, parsed);
      setPaymentAmount('');
      setSelectedDebtId(null);
      reload();
    } finally {
      setPaying(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={debts ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <SummaryRow
            title={item.creditor}
            subtitle={item.status === 'overdue' ? 'En retard' : 'En cours'}
            value={formatMoney(item.remaining, item.currency)}
            valueColor={item.status === 'overdue' ? theme.danger : undefined}
          />
        )}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !loading ? <ThemedText themeColor="textSecondary">Aucune dette en cours.</ThemedText> : null
        }
        ListFooterComponent={
          <ThemedView style={styles.footer}>
            {(debts?.length ?? 0) > 0 ? (
              <ThemedView style={styles.addRow}>
                <ThemedText type="smallBold">Enregistrer un remboursement</ThemedText>
                <ChipRow>
                  {(debts ?? []).map((d) => (
                    <Chip
                      key={d.id}
                      label={d.creditor}
                      selected={selectedDebtId === d.id}
                      onPress={() => setSelectedDebtId(d.id)}
                    />
                  ))}
                </ChipRow>
                <TextField
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  placeholder="Montant remboursé"
                  keyboardType="decimal-pad"
                />
                <PrimaryButton label="Enregistrer" onPress={handlePay} disabled={paying} />
              </ThemedView>
            ) : null}

            <ThemedView style={styles.addRow}>
              <ThemedText type="smallBold">Nouvelle dette</ThemedText>
              <TextField value={creditor} onChangeText={setCreditor} placeholder="Créancier" />
              <TextField
                value={principal}
                onChangeText={setPrincipal}
                placeholder="Montant emprunté"
                keyboardType="decimal-pad"
              />
              <PrimaryButton label="Ajouter la dette" onPress={handleCreate} disabled={creating} />
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
