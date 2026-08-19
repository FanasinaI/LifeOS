import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, ChipRow, PrimaryButton, TextField } from '@/components/money/form-kit';
import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { simulatePurchase } from '@/intelligence/simulations';
import { listAccounts } from '@/modules/finance';
import {
  createWishlistItem,
  deleteWishlistItem,
  listWishlist,
  markPurchased,
  type WishlistItem,
} from '@/modules/wishlist';
import { formatMoney } from '@/utils/format';
import { useAsyncData } from '@/utils/use-async-data';

export default function WishlistScreen() {
  const { data: items, loading, reload } = useAsyncData(() => listWishlist(), []);
  const { data: accounts } = useAsyncData(() => listAccounts(), []);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [creating, setCreating] = useState(false);
  const [simulating, setSimulating] = useState<number | null>(null);
  const [simulationText, setSimulationText] = useState<{ itemId: number; text: string } | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const parsedPrice = Number(price.replace(',', '.'));
      await createWishlistItem({
        name: name.trim(),
        price: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : null,
      });
      setName('');
      setPrice('');
      reload();
    } finally {
      setCreating(false);
    }
  }

  async function handleSimulate(item: WishlistItem) {
    const account = accounts?.[0];
    if (!account || item.price == null) return;
    setSimulating(item.id);
    try {
      const result = await simulatePurchase(account.id, item.price);
      setSimulationText({ itemId: item.id, text: `${result.summary} (compte : ${account.name})` });
    } finally {
      setSimulating(null);
    }
  }

  async function handlePurchased(itemId: number) {
    await markPurchased(itemId);
    reload();
  }

  async function handleDelete(itemId: number) {
    await deleteWishlistItem(itemId);
    reload();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={items ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ThemedView type="backgroundElement" style={styles.card}>
            <SummaryRow
              title={item.name}
              subtitle={item.priority}
              value={item.price != null ? formatMoney(item.price, item.currency) : '—'}
            />
            {simulationText?.itemId === item.id ? (
              <ThemedText type="small" themeColor="textSecondary">
                {simulationText.text}
              </ThemedText>
            ) : null}
            <ChipRow>
              <Chip
                label={simulating === item.id ? 'Simulation…' : "Simuler l'achat"}
                selected={false}
                onPress={() => handleSimulate(item)}
              />
              <Chip label="Acheté" selected={false} onPress={() => handlePurchased(item.id)} />
              <Chip label="Supprimer" selected={false} onPress={() => handleDelete(item.id)} />
            </ChipRow>
          </ThemedView>
        )}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !loading ? <ThemedText themeColor="textSecondary">Rien dans la wishlist.</ThemedText> : null
        }
        ListFooterComponent={
          <ThemedView style={styles.addRow}>
            <ThemedText type="smallBold">Nouvel article</ThemedText>
            <TextField value={name} onChangeText={setName} placeholder="Nom" />
            <TextField value={price} onChangeText={setPrice} placeholder="Prix (optionnel)" keyboardType="decimal-pad" />
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
  card: {
    padding: Spacing.two,
    borderRadius: Spacing.three,
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
