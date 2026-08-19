import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, ChipRow, PrimaryButton, TextField } from '@/components/money/form-kit';
import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createReceivable, listOpenReceivables, recordReceivablePayment } from '@/modules/finance';
import { formatMoney } from '@/utils/format';
import { useAsyncData } from '@/utils/use-async-data';

export default function ReceivablesScreen() {
  const theme = useTheme();
  const { data: receivables, loading, reload } = useAsyncData(() => listOpenReceivables(), []);

  const [debtor, setDebtor] = useState('');
  const [amount, setAmount] = useState('');
  const [creating, setCreating] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paying, setPaying] = useState(false);

  async function handleCreate() {
    const parsed = Number(amount.replace(',', '.'));
    if (!debtor.trim() || !Number.isFinite(parsed) || parsed <= 0) return;
    setCreating(true);
    try {
      await createReceivable({ debtor: debtor.trim(), amount: parsed, currency: 'MGA' });
      setDebtor('');
      setAmount('');
      reload();
    } finally {
      setCreating(false);
    }
  }

  async function handlePay() {
    const parsed = Number(paymentAmount.replace(',', '.'));
    if (!selectedId || !Number.isFinite(parsed) || parsed <= 0) return;
    setPaying(true);
    try {
      await recordReceivablePayment(selectedId, parsed);
      setPaymentAmount('');
      setSelectedId(null);
      reload();
    } finally {
      setPaying(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={receivables ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <SummaryRow
            title={item.debtor}
            subtitle={item.status === 'overdue' ? 'En retard' : 'En cours'}
            value={formatMoney(item.remaining, item.currency)}
            valueColor={item.status === 'overdue' ? theme.danger : undefined}
          />
        )}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !loading ? <ThemedText themeColor="textSecondary">Aucune créance en cours.</ThemedText> : null
        }
        ListFooterComponent={
          <ThemedView style={styles.footer}>
            {(receivables?.length ?? 0) > 0 ? (
              <ThemedView style={styles.addRow}>
                <ThemedText type="smallBold">Enregistrer un remboursement reçu</ThemedText>
                <ChipRow>
                  {(receivables ?? []).map((r) => (
                    <Chip
                      key={r.id}
                      label={r.debtor}
                      selected={selectedId === r.id}
                      onPress={() => setSelectedId(r.id)}
                    />
                  ))}
                </ChipRow>
                <TextField
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  placeholder="Montant reçu"
                  keyboardType="decimal-pad"
                />
                <PrimaryButton label="Enregistrer" onPress={handlePay} disabled={paying} />
              </ThemedView>
            ) : null}

            <ThemedView style={styles.addRow}>
              <ThemedText type="smallBold">Nouvelle créance</ThemedText>
              <TextField value={debtor} onChangeText={setDebtor} placeholder="Débiteur" />
              <TextField value={amount} onChangeText={setAmount} placeholder="Montant dû" keyboardType="decimal-pad" />
              <PrimaryButton label="Ajouter la créance" onPress={handleCreate} disabled={creating} />
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
