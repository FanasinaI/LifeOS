import type { InferSelectModel } from 'drizzle-orm';

import { savingsRepository } from '@/database/repositories';
import type { savings } from '@/database/schema/finance';

export type Saving = InferSelectModel<typeof savings>;

export interface CreateSavingInput {
  name: string;
  targetAmount: number;
  currency: string;
  targetDate?: Date | null;
  goalId?: number | null;
}

export async function createSaving(input: CreateSavingInput): Promise<Saving> {
  const now = new Date();
  return savingsRepository.insert({
    name: input.name,
    targetAmount: input.targetAmount,
    currentAmount: 0,
    currency: input.currency,
    targetDate: input.targetDate ?? null,
    goalId: input.goalId ?? null,
    createdAt: now,
    updatedAt: now,
  });
}

export async function contribute(savingId: number, amount: number): Promise<Saving | undefined> {
  const saving = await savingsRepository.findById(savingId);
  if (!saving) return undefined;
  return savingsRepository.update(savingId, {
    currentAmount: saving.currentAmount + amount,
    updatedAt: new Date(),
  });
}

export function progressPercent(saving: Saving): number {
  return saving.targetAmount > 0 ? Math.min(saving.currentAmount / saving.targetAmount, 1) : 0;
}
