import { listBudgetStatuses } from '@/modules/finance';
import { listGoals, progressPercent } from '@/modules/goals';
import { listHabitsWithStreaks } from '@/modules/habits';
import { listMealsForDay } from '@/modules/nutrition';
import { listRecentWorkouts } from '@/modules/sport';
import { listAllTasks } from '@/modules/tasks';
import { average } from '@/intelligence/analytics/stats';
import { addDays } from '@/utils/date';

export interface ScoreComponent {
  key: 'finance' | 'goals' | 'productivity' | 'habits' | 'sport' | 'nutrition';
  label: string;
  value: number;
  weight: number;
  explanation: string;
}

export interface LifeScoreResult {
  score: number;
  components: ScoreComponent[];
  computedAt: Date;
}

const WEIGHTS: Record<ScoreComponent['key'], number> = {
  finance: 0.25,
  goals: 0.15,
  productivity: 0.2,
  habits: 0.15,
  sport: 0.15,
  nutrition: 0.1,
};

const NEUTRAL_SCORE = 70;

/**
 * Life Score (§6) : score pondéré, calculé par le moteur métier — jamais l'IA. Chaque
 * composante retourne sa valeur ET son explication (bouton « Pourquoi ? », §22).
 */
export async function computeLifeScore(asOf: Date = new Date()): Promise<LifeScoreResult> {
  const [finance, goals, productivity, habits, sport, nutrition] = await Promise.all([
    computeFinanceScore(asOf),
    computeGoalsScore(),
    computeProductivityScore(asOf),
    computeHabitsScore(asOf),
    computeSportScore(asOf),
    computeNutritionScore(asOf),
  ]);

  const components: ScoreComponent[] = [
    { key: 'finance', label: 'Finance', weight: WEIGHTS.finance, ...finance },
    { key: 'goals', label: 'Objectifs', weight: WEIGHTS.goals, ...goals },
    { key: 'productivity', label: 'Productivité', weight: WEIGHTS.productivity, ...productivity },
    { key: 'habits', label: 'Habitudes', weight: WEIGHTS.habits, ...habits },
    { key: 'sport', label: 'Sport', weight: WEIGHTS.sport, ...sport },
    { key: 'nutrition', label: 'Nutrition', weight: WEIGHTS.nutrition, ...nutrition },
  ];

  const score = Math.round(components.reduce((sum, c) => sum + c.value * c.weight, 0));
  return { score, components, computedAt: asOf };
}

interface SubScore {
  value: number;
  explanation: string;
}

function clamp01to100(value: number): number {
  return Math.min(Math.max(value, 0), 100);
}

async function computeFinanceScore(asOf: Date): Promise<SubScore> {
  const statuses = await listBudgetStatuses(asOf);
  if (statuses.length === 0) {
    return { value: NEUTRAL_SCORE, explanation: 'Aucun budget défini — score neutre par défaut.' };
  }
  const avgUsage = average(statuses.map((s) => Math.min(s.percentUsed, 1.5)));
  const overBudgetCount = statuses.filter((s) => s.isOverBudget).length;
  const value = clamp01to100(100 - avgUsage * 80 - overBudgetCount * 10);
  return {
    value,
    explanation: `${statuses.length} budget(s) suivi(s), ${overBudgetCount} dépassé(s), usage moyen ${Math.round(avgUsage * 100)}%.`,
  };
}

async function computeGoalsScore(): Promise<SubScore> {
  const goals = await listGoals('active');
  if (goals.length === 0) {
    return { value: NEUTRAL_SCORE, explanation: 'Aucun objectif actif — score neutre par défaut.' };
  }
  const avgProgress = average(goals.map((g) => progressPercent(g)));
  return {
    value: clamp01to100(avgProgress * 100),
    explanation: `${goals.length} objectif(s) actif(s), progression moyenne ${Math.round(avgProgress * 100)}%.`,
  };
}

async function computeProductivityScore(asOf: Date): Promise<SubScore> {
  const all = await listAllTasks();
  const weekAgo = addDays(asOf, -7);
  const recent = all.filter((t) => t.createdAt >= weekAgo || (t.dueDate && t.dueDate >= weekAgo));
  if (recent.length === 0) {
    return { value: NEUTRAL_SCORE, explanation: 'Pas assez de tâches récentes pour évaluer.' };
  }
  const completed = recent.filter((t) => t.status === 'done').length;
  const overdue = recent.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < asOf).length;
  const value = clamp01to100((completed / recent.length) * 100 - overdue * 5);
  return { value, explanation: `${completed}/${recent.length} tâches récentes terminées, ${overdue} en retard.` };
}

async function computeHabitsScore(asOf: Date): Promise<SubScore> {
  const habits = await listHabitsWithStreaks(asOf);
  if (habits.length === 0) {
    return { value: NEUTRAL_SCORE, explanation: 'Aucune habitude suivie — score neutre par défaut.' };
  }
  const doneCount = habits.filter((h) => h.doneToday).length;
  return {
    value: clamp01to100((doneCount / habits.length) * 100),
    explanation: `${doneCount}/${habits.length} habitude(s) faite(s) aujourd'hui.`,
  };
}

const WEEKLY_WORKOUT_TARGET = 3;

async function computeSportScore(asOf: Date): Promise<SubScore> {
  const recent = await listRecentWorkouts(50);
  const weekAgo = addDays(asOf, -7);
  const thisWeek = recent.filter((w) => w.date >= weekAgo);
  return {
    value: clamp01to100((thisWeek.length / WEEKLY_WORKOUT_TARGET) * 100),
    explanation: `${thisWeek.length} séance(s) cette semaine (repère indicatif : ${WEEKLY_WORKOUT_TARGET}).`,
  };
}

const DAILY_MEAL_TARGET = 3;

async function computeNutritionScore(asOf: Date): Promise<SubScore> {
  const meals = await listMealsForDay(asOf);
  return {
    value: clamp01to100((meals.length / DAILY_MEAL_TARGET) * 100),
    explanation: `${meals.length} repas enregistré(s) aujourd'hui.`,
  };
}
