import type { InferSelectModel } from 'drizzle-orm';

import { habitLogsRepository, habitsRepository } from '@/database/repositories';
import type { habits } from '@/database/schema/organisation';
import { addDays, startOfDay, startOfWeek } from '@/utils/date';

export type Habit = InferSelectModel<typeof habits>;

export async function createHabit(
  name: string,
  cadence: Habit['cadence'] = 'daily',
  targetPerPeriod = 1
): Promise<Habit> {
  const now = new Date();
  return habitsRepository.insert({ name, cadence, targetPerPeriod, createdAt: now, updatedAt: now });
}

export function listHabits(): Promise<Habit[]> {
  return habitsRepository.findAll();
}

export async function logHabit(habitId: number, date: Date = new Date(), isDone = true): Promise<void> {
  await habitLogsRepository.insert({ habitId, date, isDone, createdAt: new Date() });
}

function periodKey(date: Date, cadence: Habit['cadence']): string {
  const anchor = cadence === 'weekly' ? startOfWeek(date) : startOfDay(date);
  return anchor.toISOString().slice(0, 10);
}

/**
 * Streak (§8) : nombre de périodes consécutives (jour, ou semaine pour une habitude
 * hebdomadaire) se terminant à aujourd'hui avec au moins un log positif. La période en cours
 * ne casse pas le streak tant qu'elle n'est pas encore passée — elle est juste ignorée si elle
 * n'a pas encore de log.
 */
export async function computeStreak(habitId: number, asOf: Date = new Date()): Promise<number> {
  const habit = await habitsRepository.findById(habitId);
  if (!habit) return 0;

  const logs = await habitLogsRepository.findByHabit(habitId);
  const doneKeys = new Set(logs.filter((l) => l.isDone).map((l) => periodKey(l.date, habit.cadence)));
  const step = habit.cadence === 'weekly' ? 7 : 1;

  let cursor = asOf;
  if (!doneKeys.has(periodKey(cursor, habit.cadence))) {
    cursor = addDays(cursor, -step);
  }

  let streak = 0;
  while (doneKeys.has(periodKey(cursor, habit.cadence))) {
    streak += 1;
    cursor = addDays(cursor, -step);
  }
  return streak;
}

export interface HabitWithStreak extends Habit {
  streak: number;
  doneToday: boolean;
}

export async function listHabitsWithStreaks(asOf: Date = new Date()): Promise<HabitWithStreak[]> {
  const all = await listHabits();
  return Promise.all(
    all.map(async (habit) => {
      const logs = await habitLogsRepository.findByHabit(habit.id);
      const doneToday = logs.some((l) => l.isDone && periodKey(l.date, habit.cadence) === periodKey(asOf, habit.cadence));
      return { ...habit, streak: await computeStreak(habit.id, asOf), doneToday };
    })
  );
}
