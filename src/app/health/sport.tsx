import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, ChipRow, PrimaryButton, TextField } from '@/components/money/form-kit';
import { SummaryRow } from '@/components/money/summary-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import {
  addSet,
  computeWorkoutVolume,
  createExercise,
  createWorkout,
  listExercises,
  listRecentWorkouts,
  listSetsForWorkout,
} from '@/modules/sport';
import { formatDate } from '@/utils/format';
import { useAsyncData } from '@/utils/use-async-data';

export default function SportScreen() {
  const { data: exercises, reload: reloadExercises } = useAsyncData(() => listExercises(), []);
  const { data: workouts, loading, reload: reloadWorkouts } = useAsyncData(() => listRecentWorkouts(), []);

  const [currentWorkoutId, setCurrentWorkoutId] = useState<number | null>(null);
  const { data: currentSets, reload: reloadCurrentSets } = useAsyncData(
    () => (currentWorkoutId ? listSetsForWorkout(currentWorkoutId) : Promise.resolve([])),
    [currentWorkoutId]
  );

  const [newExerciseName, setNewExerciseName] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleStartWorkout() {
    const workout = await createWorkout();
    setCurrentWorkoutId(workout.id);
    reloadWorkouts();
  }

  async function handleAddExercise() {
    if (!newExerciseName.trim()) return;
    const exercise = await createExercise(newExerciseName.trim());
    setNewExerciseName('');
    setSelectedExerciseId(exercise.id);
    reloadExercises();
  }

  async function handleAddSet() {
    const parsedReps = Number(reps);
    const parsedWeight = weight.trim() ? Number(weight.replace(',', '.')) : null;
    if (!currentWorkoutId || !selectedExerciseId || !Number.isFinite(parsedReps) || parsedReps <= 0) return;

    setSaving(true);
    try {
      const nextIndex = (currentSets?.length ?? 0) + 1;
      await addSet(currentWorkoutId, selectedExerciseId, nextIndex, parsedReps, parsedWeight);
      setReps('');
      setWeight('');
      reloadCurrentSets();
      reloadWorkouts();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={workouts ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ThemedView style={styles.header}>
            {currentWorkoutId ? (
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="smallBold">Séance en cours</ThemedText>

                {(currentSets ?? []).map((set) => (
                  <ThemedText key={set.id} type="small" themeColor="textSecondary">
                    Série {set.setIndex} · {set.reps} reps
                    {set.weight ? ` · ${set.weight} kg` : ''}
                  </ThemedText>
                ))}

                <ThemedText type="small">Exercice</ThemedText>
                <ChipRow>
                  {(exercises ?? []).map((ex) => (
                    <Chip
                      key={ex.id}
                      label={ex.name}
                      selected={selectedExerciseId === ex.id}
                      onPress={() => setSelectedExerciseId(ex.id)}
                    />
                  ))}
                </ChipRow>
                <ThemedView style={styles.inlineForm}>
                  <TextField value={newExerciseName} onChangeText={setNewExerciseName} placeholder="Nouvel exercice" />
                  <PrimaryButton label="+ Exercice" onPress={handleAddExercise} />
                </ThemedView>

                <TextField value={reps} onChangeText={setReps} placeholder="Répétitions" keyboardType="number-pad" />
                <TextField
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Poids (kg, optionnel)"
                  keyboardType="decimal-pad"
                />
                <PrimaryButton label="Ajouter la série" onPress={handleAddSet} disabled={saving} />
              </ThemedView>
            ) : (
              <PrimaryButton label="Démarrer une séance" onPress={handleStartWorkout} />
            )}

            <ThemedText type="smallBold">Séances récentes</ThemedText>
          </ThemedView>
        }
        renderItem={({ item }) => <WorkoutRow workoutId={item.id} date={item.date} />}
        ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
        ListEmptyComponent={
          !loading ? <ThemedText themeColor="textSecondary">Aucune séance enregistrée.</ThemedText> : null
        }
      />
    </SafeAreaView>
  );
}

function WorkoutRow({ workoutId, date }: { workoutId: number; date: Date }) {
  const { data: volume } = useAsyncData(() => computeWorkoutVolume(workoutId), [workoutId]);
  return <SummaryRow title={formatDate(date)} value={volume != null ? `${Math.round(volume)} kg·reps` : '…'} />;
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
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  inlineForm: {
    gap: Spacing.two,
  },
  separator: {
    height: Spacing.two,
  },
});
