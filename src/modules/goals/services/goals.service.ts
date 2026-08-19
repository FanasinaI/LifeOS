import type { InferSelectModel } from 'drizzle-orm';

import { goalContributionsRepository, goalsRepository } from '@/database/repositories';
import type { goals } from '@/database/schema/organisation';
import { daysBetween } from '@/utils/date';

export type Goal = InferSelectModel<typeof goals>;

export interface CreateGoalInput {
  title: string;
  domain: Goal['domain'];
  targetAmount?: number | null;
  currency?: string;
  targetDate?: Date | null;
  priority?: Goal['priority'];
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const now = new Date();
  return goalsRepository.insert({
    title: input.title,
    domain: input.domain,
    targetAmount: input.targetAmount ?? null,
    currentAmount: 0,
    currency: input.currency ?? 'MGA',
    targetDate: input.targetDate ?? null,
    priority: input.priority ?? 'medium',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });
}

export function listGoals(status?: Goal['status']): Promise<Goal[]> {
  return goalsRepository.findAll().then((all) => (status ? all.filter((g) => g.status === status) : all));
}

/** Enregistre une contribution et recale `currentAmount` sur l'historique réel (source de vérité). */
export async function contributeToGoal(
  goalId: number,
  amount: number,
  date: Date = new Date(),
  note?: string
): Promise<Goal | undefined> {
  await goalContributionsRepository.insert({ goalId, amount, date, note: note ?? null, createdAt: new Date() });
  const contributed = await goalsRepository.computeContributed(goalId);
  return goalsRepository.update(goalId, { currentAmount: contributed, updatedAt: new Date() });
}

export async function setGoalStatus(goalId: number, status: Goal['status']): Promise<Goal | undefined> {
  return goalsRepository.update(goalId, { status, updatedAt: new Date() });
}

export interface GoalPace {
  remaining: number;
  daysLeft: number;
  perDay: number;
  perWeek: number;
  perMonth: number;
}

export type PaceInput = Pick<Goal, 'targetAmount' | 'targetDate' | 'currentAmount'>;

/** Montant restant à mettre de côté par jour/semaine/mois pour tenir l'échéance (§4). */
export function computeRequiredPace(goal: PaceInput, asOf: Date = new Date()): GoalPace | null {
  if (goal.targetAmount == null || !goal.targetDate) return null;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const daysLeft = Math.max(daysBetween(asOf, goal.targetDate), 1);
  const perDay = remaining / daysLeft;
  return { remaining, daysLeft, perDay, perWeek: perDay * 7, perMonth: perDay * 30 };
}

export function progressPercent(goal: Goal): number {
  return goal.targetAmount ? Math.min(goal.currentAmount / goal.targetAmount, 1) : 0;
}
