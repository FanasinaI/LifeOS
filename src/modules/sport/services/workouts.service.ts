import type { InferSelectModel } from 'drizzle-orm';

import { workoutSetsRepository, workoutsRepository } from '@/database/repositories';
import type { workoutSets, workouts } from '@/database/schema/health';

export type Workout = InferSelectModel<typeof workouts>;
export type WorkoutSet = InferSelectModel<typeof workoutSets>;

export function listRecentWorkouts(limit = 20): Promise<Workout[]> {
  return workoutsRepository.findRecent(limit);
}

export function createWorkout(date: Date = new Date(), note?: string | null): Promise<Workout> {
  const now = new Date();
  return workoutsRepository.insert({ date, note: note ?? null, createdAt: now, updatedAt: now });
}

export function addSet(
  workoutId: number,
  exerciseId: number,
  setIndex: number,
  reps: number,
  weight?: number | null
): Promise<WorkoutSet> {
  return workoutSetsRepository.insert({
    workoutId,
    exerciseId,
    setIndex,
    reps,
    weight: weight ?? null,
    createdAt: new Date(),
  });
}

export function listSetsForWorkout(workoutId: number): Promise<WorkoutSet[]> {
  return workoutSetsRepository.findByWorkout(workoutId);
}

export function setVolume(set: WorkoutSet): number {
  return set.reps * (set.weight ?? 0);
}

export async function computeWorkoutVolume(workoutId: number): Promise<number> {
  const sets = await workoutSetsRepository.findByWorkout(workoutId);
  return sets.reduce((sum, s) => sum + setVolume(s), 0);
}
