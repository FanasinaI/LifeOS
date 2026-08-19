import type { InferSelectModel } from 'drizzle-orm';

import { transactionsRepository } from '@/database/repositories';
import type { transactions } from '@/database/schema/finance';

import { refreshAccountBalance } from './accounts.service';

export type Transaction = InferSelectModel<typeof transactions>;
export type TransactionType = Transaction['type'];

export interface CreateTransactionInput {
  accountId: number;
  toAccountId?: number | null;
  categoryId?: number | null;
  type: TransactionType;
  amount: number;
  currency: string;
  date: Date;
  note?: string | null;
  /** `pending` pour les transactions issues d'OCR/import en attente de confirmation utilisateur. */
  status?: 'pending' | 'confirmed';
  source?: 'manual' | 'ocr' | 'import';
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const now = new Date();
  const transaction = await transactionsRepository.insert({
    accountId: input.accountId,
    toAccountId: input.toAccountId ?? null,
    categoryId: input.categoryId ?? null,
    type: input.type,
    amount: input.amount,
    currency: input.currency,
    date: input.date,
    note: input.note ?? null,
    status: input.status ?? 'confirmed',
    source: input.source ?? 'manual',
    createdAt: now,
    updatedAt: now,
  });

  await syncAffectedBalances(transaction);
  return transaction;
}

/** Bascule une transaction PENDING (OCR/import) en confirmed et met à jour les soldes. */
export async function confirmTransaction(transactionId: number): Promise<Transaction | undefined> {
  const transaction = await transactionsRepository.update(transactionId, {
    status: 'confirmed',
    updatedAt: new Date(),
  });
  if (transaction) await syncAffectedBalances(transaction);
  return transaction;
}

export async function deleteTransaction(transactionId: number): Promise<void> {
  const transaction = await transactionsRepository.findById(transactionId);
  if (!transaction) return;
  await transactionsRepository.remove(transactionId);
  await syncAffectedBalances(transaction);
}

export function listRecentTransactions(limit = 20): Promise<Transaction[]> {
  return transactionsRepository.findRecent(limit);
}

export function listTransactionsForAccount(accountId: number, limit = 50): Promise<Transaction[]> {
  return transactionsRepository.findByAccount(accountId, limit);
}

async function syncAffectedBalances(transaction: Transaction): Promise<void> {
  if (transaction.status !== 'confirmed') return;
  await refreshAccountBalance(transaction.accountId);
  if (transaction.toAccountId != null) {
    await refreshAccountBalance(transaction.toAccountId);
  }
}
