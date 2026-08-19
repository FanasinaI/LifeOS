import { Pressable, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listNotifications, markNotificationRead, type NotificationRecord } from '@/modules/notifications';
import { formatDate } from '@/utils/format';
import { useAsyncData } from '@/utils/use-async-data';

function levelColor(level: NotificationRecord['level'], theme: ReturnType<typeof useTheme>) {
  switch (level) {
    case 'critique':
      return theme.danger;
    case 'important':
    case 'attention':
      return theme.warning;
    default:
      return theme.textSecondary;
  }
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const { data: items, loading, reload } = useAsyncData(() => listNotifications(), []);

  async function handlePress(id: number) {
    await markNotificationRead(id);
    reload();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={items ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable onPress={() => handlePress(item.id)}>
            <SummaryRow
              title={item.title}
              subtitle={`${formatDate(item.createdAt)} · ${item.body}`}
              value={item.isRead ? 'lu' : item.level}
              valueColor={item.isRead ? theme.textSecondary : levelColor(item.level, theme)}
            />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !loading ? <ThemedText themeColor="textSecondary">Aucune notification.</ThemedText> : null
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
