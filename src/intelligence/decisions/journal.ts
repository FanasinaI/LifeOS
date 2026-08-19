import type { InferSelectModel } from 'drizzle-orm';

import { decisionsRepository } from '@/database/repositories';
import type { decisions } from '@/database/schema/intelligence';

export type Decision = InferSelectModel<typeof decisions>;

export interface DecisionOption {
  label: string;
  impact: string;
}

export interface RecordDecisionInput {
  title: string;
  situation: string;
  optionsConsidered: DecisionOption[];
  simulationId?: number | null;
  chosenOption: string;
  reason?: string | null;
  expectedResult?: string | null;
}

/** Journal des décisions (§12) : situation, options, choix, raison, résultat attendu. */
export async function recordDecision(input: RecordDecisionInput): Promise<Decision> {
  const now = new Date();
  return decisionsRepository.insert({
    title: input.title,
    situation: input.situation,
    optionsConsidered: JSON.stringify(input.optionsConsidered),
    simulationId: input.simulationId ?? null,
    chosenOption: input.chosenOption,
    reason: input.reason ?? null,
    expectedResult: input.expectedResult ?? null,
    actualResult: null,
    decidedAt: now,
    reviewedAt: null,
    createdAt: now,
  });
}

/** Comparaison prévision/réalité (§12) — complète une décision une fois le résultat réel connu. */
export async function reviewDecision(decisionId: number, actualResult: string): Promise<Decision | undefined> {
  return decisionsRepository.update(decisionId, { actualResult, reviewedAt: new Date() });
}

export function listDecisions(): Promise<Decision[]> {
  return decisionsRepository.findAll();
}

export function parseOptions(decision: Decision): DecisionOption[] {
  try {
    return JSON.parse(decision.optionsConsidered) as DecisionOption[];
  } catch {
    return [];
  }
}
