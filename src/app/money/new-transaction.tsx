import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, ChipRow, PrimaryButton, TextField } from '@/components/money/form-kit';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { createTransaction, listAccounts, type TransactionType } from '@/modules/finance';
import { useAsyncData } from '@/utils/use-async-data';

const TYPES: { value: TransactionType; label: string }[] = [
  { value: 'expense', label: 'Dépense' },
  { value: 'income', label: 'Revenu' },
  { value: 'transfer', label: 'Transfert' },
  { value: 'refund', label: 'Remboursement' },
];

export default function NewTransactionScreen() {
  const { data: accounts } = useAsyncData(() => listAccounts(), []);
  const [type, setType] = useState<TransactionType>('expense');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [toAccountId, setToAccountId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedAccount = accounts?.find((a) => a.id === accountId);

  async function handleSubmit() {
    setErrorMessage(null);
    const parsedAmount = Number(amount.replace(',', '.'));

    if (!accountId || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Choisis un compte et un montant valide.');
      return;
    }
    if (type === 'transfer' && !toAccountId) {
      setErrorMessage('Choisis le compte de destination du transfert.');
      return;
    }

    setSaving(true);
    try {
      await createTransaction({
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : null,
        type,
        amount: parsedAmount,
        currency: selectedAccount?.currency ?? 'MGA',
        date: new Date(),
        note: note.trim() || null,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="smallBold">Type</ThemedText>
        <ChipRow>
          {TYPES.map((t) => (
            <Chip key={t.value} label={t.label} selected={type === t.value} onPress={() => setType(t.value)} />
          ))}
        </ChipRow>

        <ThemedText type="smallBold">Compte</ThemedText>
        <ChipRow>
          {(accounts ?? []).map((a) => (
            <Chip key={a.id} label={a.name} selected={accountId === a.id} onPress={() => setAccountId(a.id)} />
          ))}
        </ChipRow>

        {type === 'transfer' ? (
          <>
            <ThemedText type="smallBold">Vers</ThemedText>
            <ChipRow>
              {(accounts ?? [])
                .filter((a) => a.id !== accountId)
                .map((a) => (
                  <Chip
                    key={a.id}
                    label={a.name}
                    selected={toAccountId === a.id}
                    onPress={() => setToAccountId(a.id)}
                  />
                ))}
            </ChipRow>
          </>
        ) : null}

        <TextField value={amount} onChangeText={setAmount} placeholder="Montant" keyboardType="decimal-pad" />
        <TextField value={note} onChangeText={setNote} placeholder="Note (optionnel)" />

        {errorMessage ? <ThemedText themeColor="danger">{errorMessage}</ThemedText> : null}

        <PrimaryButton
          label={saving ? 'Enregistrement…' : 'Enregistrer'}
          onPress={handleSubmit}
          disabled={saving}
        />
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
});
