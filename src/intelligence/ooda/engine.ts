import type { InferSelectModel } from 'drizzle-orm';

import { oodaCyclesRepository } from '@/database/repositories';
import type { oodaCycles } from '@/database/schema/intelligence';
import { computeLifeScore, type LifeScoreResult } from '@/intelligence/life-score';
import { generateInsights, type Insight } from '@/intelligence/insights';
import { listAccountsWithBalances } from '@/modules/finance';
import { listPendingTasks } from '@/modules/tasks';

export type OodaCycle = InferSelectModel<typeof oodaCycles>;

export interface OodaCycleResult {
  cycle: OodaCycle;
  lifeScore: LifeScoreResult;
  insights: Insight[];
}

/**
 * §7 Boucle OODA : Observe → Orient → Decide → Act. Ce n'est pas un écran, c'est l'orchestrateur
 * qui enchaîne les moteurs déjà écrits (analytics/life-score dans Orient, rules dans Decide) et
 * journalise le cycle. ACT reste volontairement minimal ici : les insights générés sont la sortie
 * actionnable ; leur transformation en notifications réelles arrive à l'étape 8 (Utilitaires).
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

  // ACT — pour l'instant, les insights persistés SONT l'action ; ACT complet (notifications,
  // actions automatiques bornées) arrive avec les Automatisations (étape 8).
  const action = insights.length > 0 ? 'Insights enregistrés pour revue utilisateur.' : null;

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

  return { cycle, lifeScore, insights };
}

export function listRecentCycles(limit = 10): Promise<OodaCycle[]> {
  return oodaCyclesRepository.findAll().then((all) =>
    [...all].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()).slice(0, limit)
  );
}
