import { StyleSheet, type ColorValue } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function SummaryRow({
  title,
  subtitle,
  value,
  valueColor,
}: {
  title: string;
  subtitle?: string;
  value: string;
  valueColor?: ColorValue;
}) {
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <ThemedView type="backgroundElement" style={styles.textCol}>
        <ThemedText type="smallBold">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </ThemedView>
      <ThemedText type="smallBold" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  textCol: {
    gap: Spacing.half,
  },
});
