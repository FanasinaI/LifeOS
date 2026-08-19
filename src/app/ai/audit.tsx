import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { listAuditLogs } from '@/modules/audit';
import { formatDate } from '@/utils/format';
import { useAsyncData } from '@/utils/use-async-data';

export default function AuditLogScreen() {
  const { data: logs, loading } = useAsyncData(() => listAuditLogs(), []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={logs ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <SummaryRow
            title={`${item.action} · ${item.entity}${item.entityId != null ? ` #${item.entityId}` : ''}`}
            subtitle={formatDate(item.createdAt)}
            value={item.source}
          />
        )}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !loading ? <ThemedText themeColor="textSecondary">Aucune entrée d&apos;audit.</ThemedText> : null
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
});
