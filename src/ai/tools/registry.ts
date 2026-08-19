import { z } from 'zod';

import { searchLocal } from '@/ai/rag';
import { listEventsBetween, createEvent } from '@/modules/calendar';
import { listAccountsWithBalances, listBudgetStatuses } from '@/modules/finance';
import { computeRequiredPace, createGoal, listGoals, progressPercent } from '@/modules/goals';
import { listHabitsWithStreaks } from '@/modules/habits';
import { computeDailyMacros } from '@/modules/nutrition';
import { listNotes } from '@/modules/notes';
import { listRecentWorkouts } from '@/modules/sport';
import { createTask, listPendingTasks } from '@/modules/tasks';
import { computeLifeScore } from '@/intelligence/life-score';
import { listUnreadInsights } from '@/intelligence/insights';
import {
  compareScenarios,
  simulateDailySaving,
  simulateDebtRepayment,
  simulateIncomeChange,
  simulateNewSubscription,
  simulatePurchase,
} from '@/intelligence/simulations';

import type { ToolDefinition } from './types';

const emptySchema = z.object({});

// --- Lecture (§13 : get_finances, get_budget, get_tasks, get_calendar, get_goals) ---

export const getFinancesTool: ToolDefinition<Record<string, never>, unknown> = {
  name: 'get_finances',
  description: 'Comptes avec leur solde actuel, recalculé depuis les transactions confirmées.',
  inputSchema: emptySchema,
  mutates: false,
  execute: () => listAccountsWithBalances(),
};

export const getBudgetTool: ToolDefinition<Record<string, never>, unknown> = {
  name: 'get_budget',
  description: 'État de tous les budgets actifs (consommé, restant, prévision de fin de période).',
  inputSchema: emptySchema,
  mutates: false,
  execute: () => listBudgetStatuses(),
};

export const getTasksTool: ToolDefinition<Record<string, never>, unknown> = {
  name: 'get_tasks',
  description: 'Tâches en attente (ni terminées ni annulées).',
  inputSchema: emptySchema,
  mutates: false,
  execute: () => listPendingTasks(),
};

const calendarRangeSchema = z.object({ withinDays: z.number().int().positive().default(14) });

export const getCalendarTool: ToolDefinition<z.infer<typeof calendarRangeSchema>, unknown> = {
  name: 'get_calendar',
  description: 'Événements à venir dans les N prochains jours (14 par défaut).',
  inputSchema: calendarRangeSchema,
  mutates: false,
  execute: ({ withinDays }) => {
    const now = new Date();
    const end = new Date(now.getTime() + withinDays * 86_400_000);
    return listEventsBetween(now, end);
  },
};

export const getGoalsTool: ToolDefinition<Record<string, never>, unknown> = {
  name: 'get_goals',
  description: "Objectifs actifs, avec progression et rythme requis par jour pour tenir l'échéance.",
  inputSchema: emptySchema,
  mutates: false,
  execute: async () => {
    const goals = await listGoals('active');
    return goals.map((goal) => ({
      goal,
      progressPercent: progressPercent(goal),
      pace: computeRequiredPace(goal),
    }));
  },
};

export const getHabitsTool: ToolDefinition<Record<string, never>, unknown> = {
  name: 'get_habits',
  description: 'Habitudes suivies avec leur streak actuel.',
  inputSchema: emptySchema,
  mutates: false,
  execute: () => listHabitsWithStreaks(),
};

export const getWorkoutsTool: ToolDefinition<Record<string, never>, unknown> = {
  name: 'get_workouts',
  description: 'Séances de sport récentes.',
  inputSchema: emptySchema,
  mutates: false,
  execute: () => listRecentWorkouts(),
};

export const getNutritionTool: ToolDefinition<Record<string, never>, unknown> = {
  name: 'get_nutrition',
  description: "Macros consommées aujourd'hui.",
  inputSchema: emptySchema,
  mutates: false,
  execute: () => computeDailyMacros(),
};

const notesQuerySchema = z.object({ limit: z.number().int().positive().default(20) });

export const getNotesTool: ToolDefinition<z.infer<typeof notesQuerySchema>, unknown> = {
  name: 'get_notes',
  description: 'Notes récentes.',
  inputSchema: notesQuerySchema,
  mutates: false,
  execute: ({ limit }) => listNotes(limit),
};

const searchLocalSchema = z.object({ query: z.string().min(1) });

export const searchLocalTool: ToolDefinition<z.infer<typeof searchLocalSchema>, unknown> = {
  name: 'search_local',
  description: 'Recherche plein texte locale dans les notes (§16, §20) — convertit une demande naturelle en requête structurée.',
  inputSchema: searchLocalSchema,
  mutates: false,
  execute: ({ query }) => searchLocal(query),
};

// --- Simulation (§13 : run_simulation, compare_scenarios) ---

const simulationInputSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('purchase'), accountId: z.number(), amount: z.number() }),
  z.object({
    type: z.literal('income_change'),
    accountId: z.number(),
    monthlyDelta: z.number(),
    months: z.number().int().positive(),
  }),
  z.object({ type: z.literal('saving'), dailyAmount: z.number(), days: z.number().int().positive() }),
  z.object({
    type: z.literal('subscription'),
    amount: z.number(),
    frequency: z.enum(['weekly', 'monthly', 'yearly']),
  }),
  z.object({ type: z.literal('debt_repayment'), debtId: z.number(), monthlyPayment: z.number() }),
]);

type SimulationInput = z.infer<typeof simulationInputSchema>;

async function computeScenario(input: SimulationInput) {
  switch (input.type) {
    case 'purchase':
      return simulatePurchase(input.accountId, input.amount);
    case 'income_change':
      return simulateIncomeChange(input.accountId, input.monthlyDelta, input.months);
    case 'saving':
      return simulateDailySaving(input.dailyAmount, input.days);
    case 'subscription':
      return simulateNewSubscription(input.amount, input.frequency);
    case 'debt_repayment':
      return simulateDebtRepayment(input.debtId, input.monthlyPayment);
  }
}

export const runSimulationTool: ToolDefinition<SimulationInput, unknown> = {
  name: 'run_simulation',
  description:
    "Simule achat / variation de revenu / épargne / abonnement / remboursement de dette. Calcul pur : ne modifie jamais les comptes/dettes réels, seule la simulation elle-même est journalisée.",
  inputSchema: simulationInputSchema,
  mutates: false,
  execute: computeScenario,
};

const compareScenariosSchema = z.object({ scenarios: z.array(simulationInputSchema).min(1) });

export const compareScenariosTool: ToolDefinition<z.infer<typeof compareScenariosSchema>, unknown> = {
  name: 'compare_scenarios',
  description: 'Compare plusieurs scénarios de simulation côte à côte.',
  inputSchema: compareScenariosSchema,
  mutates: false,
  execute: ({ scenarios }) => compareScenarios(scenarios.map((s) => ({ label: s.type, compute: () => computeScenario(s) }))),
};

export const analyzeProgressTool: ToolDefinition<Record<string, never>, unknown> = {
  name: 'analyze_progress',
  description: 'Life Score détaillé (avec explication par composante) et alertes actives du Rules Engine.',
  inputSchema: emptySchema,
  mutates: false,
  execute: async () => ({ lifeScore: await computeLifeScore(), insights: await listUnreadInsights() }),
};

// --- Écriture — nécessitent une confirmation utilisateur (§13, §11) ---

const createTaskSchema = z.object({
  title: z.string().min(1),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export const createTaskTool: ToolDefinition<z.infer<typeof createTaskSchema>, unknown> = {
  name: 'create_task',
  description: 'Crée une tâche. Nécessite confirmation utilisateur avant écriture réelle.',
  inputSchema: createTaskSchema,
  mutates: true,
  execute: (input) => createTask(input),
};

const createEventSchema = z.object({
  title: z.string().min(1),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  location: z.string().optional(),
});

export const createEventTool: ToolDefinition<z.infer<typeof createEventSchema>, unknown> = {
  name: 'create_event',
  description: 'Crée un événement au calendrier. Nécessite confirmation utilisateur avant écriture réelle.',
  inputSchema: createEventSchema,
  mutates: true,
  execute: (input) => createEvent(input),
};

const createGoalSchema = z.object({
  title: z.string().min(1),
  domain: z.enum(['financial', 'school', 'professional', 'sport', 'personal', 'material']),
  targetAmount: z.number().positive().optional(),
  targetDate: z.coerce.date().optional(),
});

export const createGoalTool: ToolDefinition<z.infer<typeof createGoalSchema>, unknown> = {
  name: 'create_goal',
  description: 'Crée un objectif. Nécessite confirmation utilisateur avant écriture réelle.',
  inputSchema: createGoalSchema,
  mutates: true,
  execute: (input) => createGoal(input),
};

export const toolRegistry: ToolDefinition<any, any>[] = [
  getFinancesTool,
  getBudgetTool,
  getTasksTool,
  getCalendarTool,
  getGoalsTool,
  getHabitsTool,
  getWorkoutsTool,
  getNutritionTool,
  getNotesTool,
  searchLocalTool,
  runSimulationTool,
  compareScenariosTool,
  analyzeProgressTool,
  createTaskTool,
  createEventTool,
  createGoalTool,
];

export function getTool(name: string) {
  return toolRegistry.find((t) => t.name === name);
}

export async function runTool(name: string, args: unknown): Promise<unknown> {
  const tool = getTool(name);
  if (!tool) throw new Error(`Tool inconnu : ${name}`);
  const input = tool.inputSchema.parse(args);
  return tool.execute(input);
}
