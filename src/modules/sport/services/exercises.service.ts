import type { InferSelectModel } from 'drizzle-orm';

import { exercisesRepository } from '@/database/repositories';
import type { exercises } from '@/database/schema/health';

export type Exercise = InferSelectModel<typeof exercises>;

export function listExercises(): Promise<Exercise[]> {
  return exercisesRepository.findAll();
}

export function createExercise(name: string, muscleGroup?: string | null): Promise<Exercise> {
  return exercisesRepository.insert({ name, muscleGroup: muscleGroup ?? null, createdAt: new Date() });
}
