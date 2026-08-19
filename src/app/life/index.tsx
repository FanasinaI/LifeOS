import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, ChipRow, PrimaryButton, TextField } from '@/components/money/form-kit';
import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { completeTask, createTask, listPendingTasks } from '@/modules/tasks';
import { createHabit, listHabitsWithStreaks, logHabit } from '@/modules/habits';
import { formatDate } from '@/utils/format';
import { useAsyncData } from '@/utils/use-async-data';

export default function LifeScreen() {
  const theme = useTheme();
  const { data: tasks, loading: tasksLoading, reload: reloadTasks } = useAsyncData(
    () => listPendingTasks(),
    []
  );
  const { data: habits, loading: habitsLoading, reload: reloadHabits } = useAsyncData(
    () => listHabitsWithStreaks(),
    []
  );

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newHabitName, setNewHabitName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAddTask() {
    if (!newTaskTitle.trim()) return;
    setSaving(true);
    try {
      await createTask({ title: newTaskTitle.trim() });
      setNewTaskTitle('');
      reloadTasks();
    } finally {
      setSaving(false);
    }
  }

  async function handleCompleteTask(taskId: number) {
    await completeTask(taskId);
    reloadTasks();
  }

  async function handleAddHabit() {
    if (!newHabitName.trim()) return;
    setSaving(true);
    try {
      await createHabit(newHabitName.trim());
      setNewHabitName('');
      reloadHabits();
    } finally {
      setSaving(false);
    }
  }

  async function handleLogHabit(habitId: number) {
    await logHabit(habitId);
    reloadHabits();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={tasks ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ThemedView style={styles.header}>
            <ThemedText type="title">Aujourd&apos;hui</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatDate(new Date())}
            </ThemedText>

            <ChipRow>
              <Chip label="Objectifs" selected={false} onPress={() => router.push('/life/goals')} />
              <Chip label="Calendrier" selected={false} onPress={() => router.push('/life/calendar')} />
              <Chip label="Time Tracking" selected={false} onPress={() => router.push('/life/time-tracking')} />
              <Chip label="Notifications" selected={false} onPress={() => router.push('/life/notifications')} />
            </ChipRow>

            <ThemedText type="smallBold">Habitudes</ThemedText>
            {(habits ?? []).map((habit) => (
              <Pressable key={habit.id} onPress={() => handleLogHabit(habit.id)}>
                <SummaryRow
                  title={habit.name}
                  subtitle={`Streak : ${habit.streak}`}
                  value={habit.doneToday ? '✓ fait' : 'Marquer fait'}
                  valueColor={habit.doneToday ? theme.success : undefined}
                />
              </Pressable>
            ))}
            {!habitsLoading && (habits ?? []).length === 0 ? (
              <ThemedText themeColor="textSecondary">Aucune habitude pour l&apos;instant.</ThemedText>
            ) : null}
            <ThemedView style={styles.inlineForm}>
              <TextField value={newHabitName} onChangeText={setNewHabitName} placeholder="Nouvelle habitude" />
              <PrimaryButton label="Ajouter" onPress={handleAddHabit} disabled={saving} />
            </ThemedView>

            <ThemedText type="smallBold">Tâches</ThemedText>
          </ThemedView>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => handleCompleteTask(item.id)}>
            <SummaryRow
              title={item.title}
              subtitle={item.dueDate ? formatDate(item.dueDate) : undefined}
              value="Terminer"
            />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !tasksLoading ? <ThemedText themeColor="textSecondary">Aucune tâche en attente.</ThemedText> : null
        }
        ListFooterComponent={
          <ThemedView style={styles.addRow}>
            <TextField value={newTaskTitle} onChangeText={setNewTaskTitle} placeholder="Nouvelle tâche" />
            <PrimaryButton label="Ajouter la tâche" onPress={handleAddTask} disabled={saving} />
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
  inlineForm: {
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
