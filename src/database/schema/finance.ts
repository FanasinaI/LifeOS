import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', {
    enum: ['cash', 'bank', 'mvola', 'airtel_money', 'orange_money', 'custom'],
  }).notNull(),
  currency: text('currency').notNull().default('MGA'),
  balance: real('balance').notNull().default(0),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  kind: text('kind', { enum: ['income', 'expense', 'transfer'] }).notNull(),
  icon: text('icon'),
  color: text('color'),
  parentId: integer('parent_id'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id').notNull().references(() => accounts.id),
  toAccountId: integer('to_account_id').references(() => accounts.id),
  categoryId: integer('category_id').references(() => categories.id),
  type: text('type', {
    enum: ['income', 'expense', 'transfer', 'refund', 'debt', 'receivable'],
  }).notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('MGA'),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  note: text('note'),
  status: text('status', { enum: ['pending', 'confirmed'] }).notNull().default('confirmed'),
  source: text('source', { enum: ['manual', 'ocr', 'import'] }).notNull().default('manual'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const budgets = sqliteTable('budgets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  period: text('period', { enum: ['weekly', 'monthly', 'custom'] }).notNull(),
  periodStart: integer('period_start', { mode: 'timestamp_ms' }).notNull(),
  periodEnd: integer('period_end', { mode: 'timestamp_ms' }).notNull(),
  amount: real('amount').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const subscriptions = sqliteTable('subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  accountId: integer('account_id').references(() => accounts.id),
  categoryId: integer('category_id').references(() => categories.id),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('MGA'),
  frequency: text('frequency', { enum: ['weekly', 'monthly', 'yearly'] }).notNull(),
  nextDueDate: integer('next_due_date', { mode: 'timestamp_ms' }).notNull(),
  lastConfirmedDate: integer('last_confirmed_date', { mode: 'timestamp_ms' }),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const debts = sqliteTable('debts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  creditor: text('creditor').notNull(),
  principal: real('principal').notNull(),
  remaining: real('remaining').notNull(),
  currency: text('currency').notNull().default('MGA'),
  dueDate: integer('due_date', { mode: 'timestamp_ms' }),
  status: text('status', { enum: ['open', 'paid', 'overdue'] }).notNull().default('open'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const debtPayments = sqliteTable('debt_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  debtId: integer('debt_id').notNull().references(() => debts.id),
  amount: real('amount').notNull(),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const receivables = sqliteTable('receivables', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  debtor: text('debtor').notNull(),
  amount: real('amount').notNull(),
  remaining: real('remaining').notNull(),
  currency: text('currency').notNull().default('MGA'),
  dueDate: integer('due_date', { mode: 'timestamp_ms' }),
  status: text('status', { enum: ['open', 'paid', 'overdue'] }).notNull().default('open'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const receivablePayments = sqliteTable('receivable_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  receivableId: integer('receivable_id').notNull().references(() => receivables.id),
  amount: real('amount').notNull(),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const savings = sqliteTable('savings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').notNull().default(0),
  currency: text('currency').notNull().default('MGA'),
  targetDate: integer('target_date', { mode: 'timestamp_ms' }),
  goalId: integer('goal_id'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

// Multi-devises (§27) : taux enregistrés avec leur date ; offline = dernier taux local disponible
// pour la paire demandée (voir src/utils/currency.ts).
export const exchangeRates = sqliteTable('exchange_rates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  baseCurrency: text('base_currency').notNull(),
  quoteCurrency: text('quote_currency').notNull(),
  rate: real('rate').notNull(),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
