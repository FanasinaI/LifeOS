import { workoutSetsRepository } from '@/database/repositories';

import { setVolume } from './workouts.service';

export interface ExerciseRecord {
  maxWeight: number;
  maxSetVolume: number;
  totalVolumeAllTime: number;
  setCount: number;
}

/** Records (§10) : poids max, volume max sur une série, volume total cumulé pour un exercice. */
export async function computeExerciseRecord(exerciseId: number): Promise<ExerciseRecord> {
  const sets = await workoutSetsRepository.findByExercise(exerciseId);

  let maxWeight = 0;
  let maxSetVolume = 0;
  let totalVolumeAllTime = 0;

  for (const set of sets) {
    maxWeight = Math.max(maxWeight, set.weight ?? 0);
    const volume = setVolume(set);
    maxSetVolume = Math.max(maxSetVolume, volume);
    totalVolumeAllTime += volume;
  }

  return { maxWeight, maxSetVolume, totalVolumeAllTime, setCount: sets.length };
}

/**
 * Progression (§10) : volume total par séance pour un exercice, dans l'ordre chronologique —
 * de quoi tracer une courbe ou juste comparer "dernière séance" vs "avant-dernière".
 */
export async function computeVolumeHistory(exerciseId: number): Promise<{ workoutId: number; volume: number }[]> {
  const sets = await workoutSetsRepository.findByExercise(exerciseId);
  const byWorkout = new Map<number, number>();
  for (const set of sets) {
    byWorkout.set(set.workoutId, (byWorkout.get(set.workoutId) ?? 0) + setVolume(set));
  }
  return [...byWorkout.entries()].map(([workoutId, volume]) => ({ workoutId, volume }));
}
