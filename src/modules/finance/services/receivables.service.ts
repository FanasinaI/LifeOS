import type { InferSelectModel } from 'drizzle-orm';

import { receivablePaymentsRepository, receivablesRepository } from '@/database/repositories';
import type { receivables } from '@/database/schema/finance';

export type Receivable = InferSelectModel<typeof receivables>;

export interface CreateReceivableInput {
  debtor: string;
  amount: number;
  currency: string;
  dueDate?: Date | null;
}

export async function createReceivable(input: CreateReceivableInput): Promise<Receivable> {
  const now = new Date();
  return receivablesRepository.insert({
    debtor: input.debtor,
    amount: input.amount,
    remaining: input.amount,
    currency: input.currency,
    dueDate: input.dueDate ?? null,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  });
}

/** Enregistre un remboursement reçu, met à jour le restant dû et le statut. */
export async function recordReceivablePayment(
  receivableId: number,
  amount: number,
  date: Date = new Date()
): Promise<Receivable | undefined> {
  const receivable = await receivablesRepository.findById(receivableId);
  if (!receivable) return undefined;

  await receivablePaymentsRepository.insert({ receivableId, amount, date, createdAt: new Date() });

  const remaining = Math.max(receivable.remaining - amount, 0);
  const status: Receivable['status'] =
    remaining <= 0 ? 'paid' : receivable.status === 'overdue' ? 'overdue' : 'open';

  return receivablesRepository.update(receivableId, { remaining, status, updatedAt: new Date() });
}

export async function refreshOverdueReceivables(asOf: Date = new Date()): Promise<void> {
  const all = await receivablesRepository.findAll();
  for (const receivable of all) {
    if (receivable.status === 'paid' || !receivable.dueDate) continue;
    const shouldBeOverdue = receivable.dueDate < asOf && receivable.remaining > 0;
    if (shouldBeOverdue && receivable.status !== 'overdue') {
      await receivablesRepository.update(receivable.id, { status: 'overdue', updatedAt: new Date() });
    }
  }
}

export function listOpenReceivables(): Promise<Receivable[]> {
  return receivablesRepository.findAll().then((all) => all.filter((r) => r.status !== 'paid'));
}
