import type { InferSelectModel } from 'drizzle-orm';

import { automationRulesRepository } from '@/database/repositories';
import type { automationRules } from '@/database/schema/utilitaires';
import { listBudgetStatuses } from '@/modules/finance';
import { computeRequiredPace, listGoals } from '@/modules/goals';
import { listHabitsWithStreaks } from '@/modules/habits';
import { notify } from '@/modules/notifications';
import { createTask } from '@/modules/tasks';
import { daysBetween } from '@/utils/date';

export type AutomationRuleRow = InferSelectModel<typeof automationRules>;

/**
 * Vocabulaire fixe (pas un DSL libre) : déclencheurs et actions limités à ce que le CDC autorise
 * (§20) — créer tâche/rappel, notifier. Aucune action financière n'existe dans ce vocabulaire,
 * donc "aucune opération financière irréversible automatique" est garanti par construction, pas
 * par une vérification a posteriori.
 */
export type AutomationTrigger =
  | { kind: 'budget_threshold'; categoryId: number; percent: number }
  | { kind: 'goal_deadline'; goalId: number; daysBefore: number }
  | { kind: 'habit_missed'; habitId: number };

export type AutomationAction =
  | { kind: 'create_task'; title: string }
  | { kind: 'notify'; title: string; message: string };

export interface AutomationRule {
  id: number;
  name: string;
  isActive: boolean;
  trigger: AutomationTrigger;
  action: AutomationAction;
}

function parseRule(row: AutomationRuleRow): AutomationRule {
  return {
    id: row.id,
    name: row.name,
    isActive: row.isActive,
    trigger: JSON.parse(row.trigger) as AutomationTrigger,
    action: JSON.parse(row.action) as AutomationAction,
  };
}

export async function createAutomationRule(
  name: string,
  trigger: AutomationTrigger,
  action: AutomationAction
): Promise<AutomationRule> {
  const now = new Date();
  const row = await automationRulesRepository.insert({
    name,
    trigger: JSON.stringify(trigger),
    condition: null,
    action: JSON.stringify(action),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  return parseRule(row);
}

export async function listAutomationRules(): Promise<AutomationRule[]> {
  const rows = await automationRulesRepository.findAll();
  return rows.map(parseRule);
}

export async function setAutomationRuleActive(ruleId: number, isActive: boolean): Promise<void> {
  await automationRulesRepository.update(ruleId, { isActive, updatedAt: new Date() });
}

export async function deleteAutomationRule(ruleId: number): Promise<void> {
  await automationRulesRepository.remove(ruleId);
}

async function triggerMatches(trigger: AutomationTrigger): Promise<boolean> {
  switch (trigger.kind) {
    case 'budget_threshold': {
      const statuses = await listBudgetStatuses();
      return statuses.some((s) => s.budget.categoryId === trigger.categoryId && s.percentUsed >= trigger.percent);
    }
    case 'goal_deadline': {
      const goals = await listGoals('active');
      const goal = goals.find((g) => g.id === trigger.goalId);
      if (!goal?.targetDate) return false;
      const pace = computeRequiredPace(goal);
      return pace != null && daysBetween(new Date(), goal.targetDate) <= trigger.daysBefore;
    }
    case 'habit_missed': {
      const habits = await listHabitsWithStreaks();
      const habit = habits.find((h) => h.id === trigger.habitId);
      return habit != null && !habit.doneToday;
    }
  }
}

async function runAction(action: AutomationAction): Promise<void> {
  switch (action.kind) {
    case 'create_task':
      await createTask({ title: action.title });
      return;
    case 'notify':
      await notify({ level: 'info', title: action.title, body: action.message, domain: 'automation' });
      return;
  }
}

/** Évalue toutes les règles actives et exécute leur action si le déclencheur correspond. */
export async function evaluateAutomationRules(): Promise<{ rule: AutomationRule; fired: boolean }[]> {
  const rules = (await listAutomationRules()).filter((r) => r.isActive);
  const results: { rule: AutomationRule; fired: boolean }[] = [];

  for (const rule of rules) {
    const fired = await triggerMatches(rule.trigger);
    if (fired) await runAction(rule.action);
    results.push({ rule, fired });
  }

  return results;
}
