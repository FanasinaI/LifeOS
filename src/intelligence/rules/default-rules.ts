import { detectForgotten, listBudgetStatuses, listOpenDebts, type BudgetStatus, type Debt, type Subscription } from '@/modules/finance';
import { computeRequiredPace, listGoals, progressPercent, type Goal } from '@/modules/goals';
import { listHabitsWithStreaks, type HabitWithStreak } from '@/modules/habits';
import { daysBetween } from '@/utils/date';

import { evaluateRule, type RuleDefinition, type RuleFinding } from './engine';

/** SI dépenses > 80 % du budget ET jour > 20 ALORS alerte élevée — exemple direct du CDC (§8). */
function budgetThresholdRule(asOf: Date): RuleDefinition<BudgetStatus> {
  return {
    id: 'budget_threshold',
    description: 'Budget consommé à plus de 80 % après le 20 du mois.',
    loadFacts: () => listBudgetStatuses(asOf),
    condition: (status) => status.percentUsed > 0.8 && asOf.getDate() > 20,
    toFinding: (status) => ({
      ruleId: 'budget_threshold',
      domain: 'finance',
      severity: status.isOverBudget ? 'critique' : 'important',
      title: 'Budget bientôt dépassé',
      message: `Budget utilisé à ${Math.round(status.percentUsed * 100)}% alors que le mois avance.`,
      dataRef: { budgetId: status.budget.id },
    }),
  };
}

function goalDeadlineRule(asOf: Date): RuleDefinition<Goal> {
  return {
    id: 'goal_deadline_at_risk',
    description: "Objectif dont l'échéance approche sans que la cible soit atteinte.",
    loadFacts: () => listGoals('active'),
    condition: (goal) => {
      if (!goal.targetDate || !goal.targetAmount) return false;
      const daysLeft = daysBetween(asOf, goal.targetDate);
      return daysLeft >= 0 && daysLeft <= 7 && progressPercent(goal) < 0.9;
    },
    toFinding: (goal) => {
      const pace = computeRequiredPace(goal, asOf);
      return {
        ruleId: 'goal_deadline_at_risk',
        domain: 'goals',
        severity: 'attention',
        title: 'Objectif bientôt à échéance',
        message: `"${goal.title}" à ${Math.round(progressPercent(goal) * 100)}%, échéance dans ${daysBetween(asOf, goal.targetDate!)} jour(s)${pace ? ` — ${Math.round(pace.perDay)} ${goal.currency}/jour requis` : ''}.`,
        dataRef: { goalId: goal.id },
      };
    },
  };
}

function habitStreakAtRiskRule(asOf: Date): RuleDefinition<HabitWithStreak> {
  return {
    id: 'habit_streak_at_risk',
    description: "Habitude avec un streak actif pas encore validée aujourd'hui.",
    loadFacts: () => listHabitsWithStreaks(asOf),
    condition: (habit) => !habit.doneToday && habit.streak > 0,
    toFinding: (habit) => ({
      ruleId: 'habit_streak_at_risk',
      domain: 'habits',
      severity: habit.streak >= 7 ? 'important' : 'attention',
      title: 'Streak en jeu',
      message: `"${habit.name}" : streak de ${habit.streak} pas encore validé aujourd'hui.`,
      dataRef: { habitId: habit.id },
    }),
  };
}

function forgottenSubscriptionRule(asOf: Date): RuleDefinition<Subscription> {
  return {
    id: 'subscription_forgotten',
    description: "Abonnement actif dont l'échéance est dépassée sans confirmation récente.",
    loadFacts: () => detectForgotten(3, asOf),
    condition: () => true,
    toFinding: (subscription) => ({
      ruleId: 'subscription_forgotten',
      domain: 'finance',
      severity: 'attention',
      title: 'Abonnement oublié ?',
      message: `"${subscription.name}" a dépassé son échéance sans confirmation récente.`,
      dataRef: { subscriptionId: subscription.id },
    }),
  };
}

function overdueDebtRule(asOf: Date): RuleDefinition<Debt> {
  return {
    id: 'debt_overdue',
    description: "Dette dont l'échéance est dépassée.",
    loadFacts: () => listOpenDebts(),
    condition: (debt) => debt.dueDate != null && debt.dueDate < asOf && debt.remaining > 0,
    toFinding: (debt) => ({
      ruleId: 'debt_overdue',
      domain: 'finance',
      severity: 'important',
      title: 'Dette en retard',
      message: `Dette envers ${debt.creditor} en retard : ${debt.remaining} ${debt.currency} restants.`,
      dataRef: { debtId: debt.id },
    }),
  };
}

/** Évaluateurs déjà liés à leur règle — voir la note dans `engine.ts` sur pourquoi ce type. */
export function createDefaultRules(asOf: Date = new Date()): (() => Promise<RuleFinding[]>)[] {
  return [
    () => evaluateRule(budgetThresholdRule(asOf)),
    () => evaluateRule(goalDeadlineRule(asOf)),
    () => evaluateRule(habitStreakAtRiskRule(asOf)),
    () => evaluateRule(forgottenSubscriptionRule(asOf)),
    () => evaluateRule(overdueDebtRule(asOf)),
  ];
}
