import type { InferSelectModel } from 'drizzle-orm';

import { debtPaymentsRepository, debtsRepository } from '@/database/repositories';
import type { debts } from '@/database/schema/finance';

export type Debt = InferSelectModel<typeof debts>;

export interface CreateDebtInput {
  creditor: string;
  principal: number;
  currency: string;
  dueDate?: Date | null;
}

export async function createDebt(input: CreateDebtInput): Promise<Debt> {
  const now = new Date();
  return debtsRepository.insert({
    creditor: input.creditor,
    principal: input.principal,
    remaining: input.principal,
    currency: input.currency,
    dueDate: input.dueDate ?? null,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  });
}

/** Enregistre un remboursement, met à jour le restant dû et le statut. */
export async function recordDebtPayment(debtId: number, amount: number, date: Date = new Date()): Promise<Debt | undefined> {
  const debt = await debtsRepository.findById(debtId);
  if (!debt) return undefined;

  await debtPaymentsRepository.insert({ debtId, amount, date, createdAt: new Date() });

  const remaining = Math.max(debt.remaining - amount, 0);
  const status: Debt['status'] = remaining <= 0 ? 'paid' : debt.status === 'overdue' ? 'overdue' : 'open';

  return debtsRepository.update(debtId, { remaining, status, updatedAt: new Date() });
}

/** À appeler périodiquement (ou par le Rules Engine, étape 6) pour marquer les dettes en retard. */
export async function refreshOverdueDebts(asOf: Date = new Date()): Promise<void> {
  const all = await debtsRepository.findAll();
  for (const debt of all) {
    if (debt.status === 'paid' || !debt.dueDate) continue;
    const shouldBeOverdue = debt.dueDate < asOf && debt.remaining > 0;
    if (shouldBeOverdue && debt.status !== 'overdue') {
      await debtsRepository.update(debt.id, { status: 'overdue', updatedAt: new Date() });
    }
  }
}

export function listOpenDebts(): Promise<Debt[]> {
  return debtsRepository.findAll().then((all) => all.filter((d) => d.status !== 'paid'));
}
