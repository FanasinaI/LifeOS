import type { InferSelectModel } from 'drizzle-orm';

import { oodaCyclesRepository } from '@/database/repositories';
import type { oodaCycles } from '@/database/schema/intelligence';
import { computeLifeScore, type LifeScoreResult } from '@/intelligence/life-score';
import { generateInsights, type Insight } from '@/intelligence/insights';
import { evaluateAutomationRules } from '@/modules/automation';
import { listAccountsWithBalances } from '@/modules/finance';
import { listPendingTasks } from '@/modules/tasks';

export type OodaCycle = InferSelectModel<typeof oodaCycles>;

export interface OodaCycleResult {
  cycle: OodaCycle;
  lifeScore: LifeScoreResult;
  insights: Insight[];
  automationsFired: number;
}

/**
 * §7 Boucle OODA : Observe → Orient → Decide → Act. Ce n'est pas un écran, c'est l'orchestrateur
 * qui enchaîne les moteurs déjà écrits (analytics/life-score dans Orient, rules dans Decide) et
 * journalise le cycle. ACT évalue les automatisations de l'utilisateur (§20) — leur vocabulaire
 * d'actions (create_task/notify) exclut par construction toute opération financière irréversible.
 */
export async function runOodaCycle(asOf: Date = new Date()): Promise<OodaCycleResult> {
  const startedAt = new Date();

  // OBSERVE — collecter un instantané de l'état courant.
  const [accounts, pendingTasks] = await Promise.all([listAccountsWithBalances(), listPendingTasks()]);
  const totalBalance = accounts.reduce((sum, a) => sum + a.computedBalance, 0);
  const observeSummary = `${accounts.length} compte(s) (solde total ${totalBalance.toFixed(2)}), ${pendingTasks.length} tâche(s) en attente.`;

  // ORIENT — comprendre le contexte via le Life Score.
  const lifeScore = await computeLifeScore(asOf);
  const orientSummary = `Life Score ${lifeScore.score}/100 (${lifeScore.components.map((c) => `${c.label} ${Math.round(c.value)}`).join(', ')}).`;

  // DECIDE — le Rules Engine détermine ce qui mérite attention.
  const insights = await generateInsights(asOf);
  const decision = insights.length > 0 ? `${insights.length} insight(s) à examiner.` : 'Rien à signaler.';

  // ACT — insights persistés + notifiés, et automatisations utilisateur évaluées.
  const automationResults = await evaluateAutomationRules();
  const automationsFired = automationResults.filter((r) => r.fired).length;
  const action =
    insights.length > 0 || automationsFired > 0
      ? `${insights.length} insight(s) notifié(s), ${automationsFired} automatisation(s) déclenchée(s).`
      : null;

  const cycle = await oodaCyclesRepository.insert({
    startedAt,
    completedAt: new Date(),
    observeSummary,
    orientSummary,
    decision,
    action,
    resultSummary: null,
    createdAt: new Date(),
  });

  return { cycle, lifeScore, insights, automationsFired };
}

export function listRecentCycles(limit = 10): Promise<OodaCycle[]> {
  return oodaCyclesRepository.findAll().then((all) =>
    [...all].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()).slice(0, limit)
  );
}
