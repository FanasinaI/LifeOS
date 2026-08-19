import type { InferSelectModel } from 'drizzle-orm';

import { budgetsRepository } from '@/database/repositories';
import type { budgets } from '@/database/schema/finance';
import { daysBetween } from '@/utils/date';

export type Budget = InferSelectModel<typeof budgets>;

export interface BudgetStatus {
  budget: Budget;
  consumed: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  /** Projection linéaire du total en fin de période à partir du rythme de dépense actuel. */
  forecastedTotal: number;
}

export async function getBudgetStatus(budgetId: number, asOf: Date = new Date()): Promise<BudgetStatus | undefined> {
  const budget = await budgetsRepository.findById(budgetId);
  if (!budget) return undefined;
  return computeStatus(budget, asOf);
}

export async function listBudgetStatuses(asOf: Date = new Date()): Promise<BudgetStatus[]> {
  const all = await budgetsRepository.findAll();
  return Promise.all(all.map((budget) => computeStatus(budget, asOf)));
}

async function computeStatus(budget: Budget, asOf: Date): Promise<BudgetStatus> {
  const consumed = await budgetsRepository.computeConsumed(budget.id);
  const remaining = budget.amount - consumed;
  const percentUsed = budget.amount > 0 ? consumed / budget.amount : 0;

  const totalDays = Math.max(daysBetween(budget.periodStart, budget.periodEnd), 1);
  const elapsedDays = Math.min(Math.max(daysBetween(budget.periodStart, asOf), 0), totalDays);
  const dailyRate = elapsedDays > 0 ? consumed / elapsedDays : 0;
  const forecastedTotal = elapsedDays > 0 ? dailyRate * totalDays : consumed;

  return {
    budget,
    consumed,
    remaining,
    percentUsed,
    isOverBudget: consumed > budget.amount,
    forecastedTotal,
  };
}

export interface CreateBudgetInput {
  categoryId: number;
  period: Budget['period'];
  periodStart: Date;
  periodEnd: Date;
  amount: number;
}

export async function createBudget(input: CreateBudgetInput): Promise<Budget> {
  const now = new Date();
  return budgetsRepository.insert({ ...input, createdAt: now, updatedAt: now });
}
