import type { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Small shared building blocks for the MONEY screens (accounts/transactions/budgets/debts/
// receivables/patrimoine) — they all use the same chip-picker + text-field + submit pattern.

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <ThemedView type={selected ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
        <ThemedText type="small">{label}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function TextField(props: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }, props.style]}
      {...props}
    />
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <ThemedView type="backgroundSelected" style={[styles.button, disabled && styles.buttonDisabled]}>
        <ThemedText type="smallBold">{label}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  button: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
