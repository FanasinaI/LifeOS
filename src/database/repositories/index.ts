import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '../client';
import { aiKnowledgeChunks, aiMemory, aiModels, aiSessions } from '../schema/ai';
import {
  accounts,
  budgets,
  categories,
  debtPayments,
  debts,
  exchangeRates,
  receivablePayments,
  receivables,
  savings,
  subscriptions,
  transactions,
} from '../schema/finance';
import { decisions, insights, oodaCycles, simulationResults, simulations } from '../schema/intelligence';
import {
  events,
  goalContributions,
  goals,
  habitLogs,
  habits,
  projects,
  subtasks,
  tasks,
  timeSessions,
  timelineEvents,
} from '../schema/organisation';
import { exercises, foods, mealItems, meals, waterLogs, workoutSets, workouts } from '../schema/health';
import { assetDepreciations, assets } from '../schema/patrimoine';
import {
  auditLogs,
  automationRules,
  backupMetadata,
  backups,
  documents,
  notes,
  notifications,
  ocrItems,
  settings,
  wishlistItems,
} from '../schema/utilitaires';
import { createRepository } from './base.repository';

// --- Finance ---
export const categoriesRepository = createRepository(categories);

export const transactionsRepository = {
  ...createRepository(transactions),
  /** Transactions les plus récentes, triées en base plutôt qu'en JS — cette table croît sans borne. */
  async findRecent(limit = 20) {
    return db.select().from(transactions).orderBy(desc(transactions.date)).limit(limit);
  },
  async findByAccount(accountId: number, limit = 50) {
    return db
      .select()
      .from(transactions)
      .where(sql`${transactions.accountId} = ${accountId} or ${transactions.toAccountId} = ${accountId}`)
      .orderBy(desc(transactions.date))
      .limit(limit);
  },
};

export const subscriptionsRepository = createRepository(subscriptions);
export const debtsRepository = createRepository(debts);
export const debtPaymentsRepository = createRepository(debtPayments);
export const receivablesRepository = createRepository(receivables);
export const receivablePaymentsRepository = createRepository(receivablePayments);
export const savingsRepository = createRepository(savings);

export const exchangeRatesRepository = {
  ...createRepository(exchangeRates),
  /** Dernier taux local connu pour base->quote à une date donnée (par défaut maintenant). */
  async findLatest(base: string, quote: string, asOf: Date = new Date()) {
    const rows = await db
      .select()
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.baseCurrency, base),
          eq(exchangeRates.quoteCurrency, quote),
          sql`${exchangeRates.date} <= ${asOf.getTime()}`
        )
      )
      .orderBy(desc(exchangeRates.date))
      .limit(1);
    return rows[0];
  },
};

export const accountsRepository = {
  ...createRepository(accounts),
  /** Solde courant recalculé depuis les transactions confirmées — vérifie/dérive `accounts.balance`. */
  async computeBalance(accountId: number): Promise<number> {
    const [row] = await db
      .select({
        total: sql<number>`coalesce(sum(case
          when ${transactions.type} = 'income' then ${transactions.amount}
          when ${transactions.type} = 'expense' then -${transactions.amount}
          when ${transactions.type} = 'refund' then ${transactions.amount}
          when ${transactions.type} = 'transfer' and ${transactions.accountId} = ${accountId} then -${transactions.amount}
          when ${transactions.type} = 'transfer' and ${transactions.toAccountId} = ${accountId} then ${transactions.amount}
          else 0
        end), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, 'confirmed'),
          sql`(${transactions.accountId} = ${accountId} or ${transactions.toAccountId} = ${accountId})`
        )
      );
    return row?.total ?? 0;
  },
};

export const budgetsRepository = {
  ...createRepository(budgets),
  /** Montant consommé sur la période du budget (dépenses confirmées de sa catégorie). */
  async computeConsumed(budgetId: number): Promise<number> {
    const budget = await db.select().from(budgets).where(eq(budgets.id, budgetId)).then((r) => r[0]);
    if (!budget) return 0;
    const [row] = await db
      .select({ total: sql<number>`coalesce(sum(${transactions.amount}), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.categoryId, budget.categoryId),
          eq(transactions.type, 'expense'),
          eq(transactions.status, 'confirmed'),
          sql`${transactions.date} >= ${budget.periodStart} and ${transactions.date} <= ${budget.periodEnd}`
        )
      );
    return row?.total ?? 0;
  },
};

// --- Patrimoine ---
export const assetsRepository = createRepository(assets);
export const assetDepreciationsRepository = createRepository(assetDepreciations);

// --- Organisation ---
export const projectsRepository = createRepository(projects);

export const tasksRepository = {
  ...createRepository(tasks),
  /** Tâches non terminées, triées par échéance (nulls en dernier) — pour l'écran "aujourd'hui". */
  async findPending() {
    return db
      .select()
      .from(tasks)
      .where(sql`${tasks.status} not in ('done', 'cancelled')`)
      .orderBy(sql`${tasks.dueDate} is null, ${tasks.dueDate} asc`);
  },
};

export const subtasksRepository = {
  ...createRepository(subtasks),
  async findByTask(taskId: number) {
    return db.select().from(subtasks).where(eq(subtasks.taskId, taskId));
  },
};

export const eventsRepository = {
  ...createRepository(events),
  async findBetween(start: Date, end: Date) {
    return db
      .select()
      .from(events)
      .where(and(sql`${events.startAt} <= ${end.getTime()}`, sql`${events.endAt} >= ${start.getTime()}`))
      .orderBy(events.startAt);
  },
};

export const habitsRepository = createRepository(habits);

export const habitLogsRepository = {
  ...createRepository(habitLogs),
  async findByHabit(habitId: number) {
    return db.select().from(habitLogs).where(eq(habitLogs.habitId, habitId)).orderBy(desc(habitLogs.date));
  },
};

export const timeSessionsRepository = {
  ...createRepository(timeSessions),
  /** Session en cours (endAt non renseigné) — une seule à la fois par construction du service. */
  async findActive() {
    const rows = await db.select().from(timeSessions).where(sql`${timeSessions.endAt} is null`).limit(1);
    return rows[0];
  },
  async findRecent(limit = 20) {
    return db.select().from(timeSessions).orderBy(desc(timeSessions.startAt)).limit(limit);
  },
};

export const timelineEventsRepository = {
  ...createRepository(timelineEvents),
  async findBetween(start: Date, end: Date) {
    return db
      .select()
      .from(timelineEvents)
      .where(
        and(
          sql`${timelineEvents.occurredAt} >= ${start.getTime()}`,
          sql`${timelineEvents.occurredAt} <= ${end.getTime()}`
        )
      )
      .orderBy(desc(timelineEvents.occurredAt));
  },
};

export const goalsRepository = {
  ...createRepository(goals),
  /** Somme des contributions enregistrées pour l'objectif (progression réelle vs `currentAmount` caché). */
  async computeContributed(goalId: number): Promise<number> {
    const [row] = await db
      .select({ total: sql<number>`coalesce(sum(${goalContributions.amount}), 0)` })
      .from(goalContributions)
      .where(eq(goalContributions.goalId, goalId));
    return row?.total ?? 0;
  },
};
export const goalContributionsRepository = createRepository(goalContributions);

// --- Health (sans sommeil) ---
export const exercisesRepository = createRepository(exercises);

export const workoutsRepository = {
  ...createRepository(workouts),
  async findRecent(limit = 20) {
    return db.select().from(workouts).orderBy(desc(workouts.date)).limit(limit);
  },
};

export const workoutSetsRepository = {
  ...createRepository(workoutSets),
  async findByWorkout(workoutId: number) {
    return db.select().from(workoutSets).where(eq(workoutSets.workoutId, workoutId));
  },
  async findByExercise(exerciseId: number) {
    return db.select().from(workoutSets).where(eq(workoutSets.exerciseId, exerciseId));
  },
};

export const foodsRepository = createRepository(foods);

export const mealsRepository = {
  ...createRepository(meals),
  async findBetween(start: Date, end: Date) {
    return db
      .select()
      .from(meals)
      .where(and(sql`${meals.date} >= ${start.getTime()}`, sql`${meals.date} <= ${end.getTime()}`))
      .orderBy(desc(meals.date));
  },
};

export const mealItemsRepository = {
  ...createRepository(mealItems),
  async findByMeal(mealId: number) {
    return db.select().from(mealItems).where(eq(mealItems.mealId, mealId));
  },
};

export const waterLogsRepository = {
  ...createRepository(waterLogs),
  async findBetween(start: Date, end: Date) {
    return db
      .select()
      .from(waterLogs)
      .where(and(sql`${waterLogs.date} >= ${start.getTime()}`, sql`${waterLogs.date} <= ${end.getTime()}`))
      .orderBy(desc(waterLogs.date));
  },
};

// --- Intelligence ---
export const insightsRepository = createRepository(insights);
export const simulationsRepository = createRepository(simulations);
export const simulationResultsRepository = createRepository(simulationResults);
export const decisionsRepository = createRepository(decisions);
export const oodaCyclesRepository = createRepository(oodaCycles);

// --- AI ---
export const aiSessionsRepository = createRepository(aiSessions);
export const aiModelsRepository = createRepository(aiModels);
export const aiMemoryRepository = createRepository(aiMemory);
export const aiKnowledgeChunksRepository = createRepository(aiKnowledgeChunks);

// --- Utilitaires ---
export const notificationsRepository = createRepository(notifications);
export const backupsRepository = createRepository(backups);
export const backupMetadataRepository = createRepository(backupMetadata);
export const auditLogsRepository = createRepository(auditLogs);
export const settingsRepository = {
  ...createRepository(settings),
  async findByKey(key: string) {
    const rows = await db.select().from(settings).where(eq(settings.key, key));
    return rows[0];
  },
  /** Upsert par clé — pratique pour des préférences ponctuelles (ex. security.lock_timeout_ms). */
  async setValue(key: string, value: string): Promise<void> {
    const rows = await db.select().from(settings).where(eq(settings.key, key));
    const existing = rows[0];
    if (existing) {
      await db.update(settings).set({ value, updatedAt: new Date() }).where(eq(settings.id, existing.id));
    } else {
      await db.insert(settings).values({ key, value, updatedAt: new Date() });
    }
  },
};
export const wishlistItemsRepository = createRepository(wishlistItems);
export const notesRepository = createRepository(notes);
export const documentsRepository = createRepository(documents);
export const ocrItemsRepository = createRepository(ocrItems);
export const automationRulesRepository = createRepository(automationRules);
