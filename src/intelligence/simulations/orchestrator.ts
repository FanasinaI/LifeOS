import { simulationResultsRepository, simulationsRepository } from '@/database/repositories';
import type { simulations } from '@/database/schema/intelligence';

import type { ScenarioResult } from './finance-simulations';

export type SimulationType = (typeof simulations.$inferInsert)['type'];

/**
 * Exécute un calcul de simulation (pur, lecture seule — voir finance-simulations.ts) et
 * n'enregistre QUE le résultat de la simulation dans le journal (`simulations` /
 * `simulation_results`) — jamais dans les tables métier réelles. Rien n'est appliqué tant que
 * l'utilisateur n'a pas explicitement confirmé une action derrière (§10, §11).
 */
export async function runSimulation(
  type: SimulationType,
  inputParams: Record<string, unknown>,
  compute: () => Promise<ScenarioResult> | ScenarioResult
): Promise<{ simulationId: number; result: ScenarioResult }> {
  const result = await compute();

  const simulation = await simulationsRepository.insert({
    type,
    label: result.label,
    inputParams: JSON.stringify(inputParams),
    createdAt: new Date(),
  });

  await simulationResultsRepository.insert({
    simulationId: simulation.id,
    scenarioLabel: result.label,
    financeImpact: JSON.stringify(result.financeImpact),
    timeImpact: null,
    goalsImpact: null,
    lifeScoreImpact: null,
    createdAt: new Date(),
  });

  return { simulationId: simulation.id, result };
}

export interface NamedScenario {
  label: string;
  compute: () => Promise<ScenarioResult> | ScenarioResult;
}

/** §10 : comparer plusieurs scénarios côte à côte, sans rien écrire dans les données réelles. */
export async function compareScenarios(scenarios: NamedScenario[]): Promise<ScenarioResult[]> {
  return Promise.all(scenarios.map((s) => s.compute()));
}
