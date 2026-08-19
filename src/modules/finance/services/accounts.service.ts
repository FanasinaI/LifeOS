import type { InferSelectModel } from 'drizzle-orm';

import { accountsRepository } from '@/database/repositories';
import type { accounts } from '@/database/schema/finance';

export type Account = InferSelectModel<typeof accounts>;
export type AccountType = Account['type'];
export type AccountWithBalance = Account & { computedBalance: number };

export async function listAccounts(includeArchived = false): Promise<Account[]> {
  const all = await accountsRepository.findAll();
  return includeArchived ? all : all.filter((a) => !a.isArchived);
}

/** Comptes avec leur solde recalculé depuis les transactions confirmées (source de vérité). */
export async function listAccountsWithBalances(includeArchived = false): Promise<AccountWithBalance[]> {
  const list = await listAccounts(includeArchived);
  return Promise.all(
    list.map(async (account) => ({
      ...account,
      computedBalance: await accountsRepository.computeBalance(account.id),
    }))
  );
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency: string;
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  const now = new Date();
  return accountsRepository.insert({
    name: input.name,
    type: input.type,
    currency: input.currency,
    balance: 0,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  });
}

export async function archiveAccount(accountId: number): Promise<void> {
  await accountsRepository.update(accountId, { isArchived: true, updatedAt: new Date() });
}

/** Réaligne le cache `accounts.balance` sur le solde recalculé depuis les transactions confirmées. */
export async function refreshAccountBalance(accountId: number): Promise<number> {
  const computed = await accountsRepository.computeBalance(accountId);
  await accountsRepository.update(accountId, { balance: computed, updatedAt: new Date() });
  return computed;
}
