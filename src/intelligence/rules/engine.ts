export type Severity = 'info' | 'attention' | 'important' | 'critique';

export interface RuleFinding {
  ruleId: string;
  domain: string;
  severity: Severity;
  title: string;
  message: string;
  /** Référence libre vers l'entité concernée (id de budget, d'objectif...) — pour l'explicabilité. */
  dataRef?: Record<string, unknown>;
}

/**
 * Une règle IF/THEN (§8) : `loadFacts` observe, `condition` est le IF, `toFinding` est le THEN.
 * Déterministe, offline, explicable — aucune IA impliquée.
 */
export interface RuleDefinition<TFact> {
  id: string;
  description: string;
  loadFacts: () => Promise<TFact[]>;
  condition: (fact: TFact) => boolean;
  toFinding: (fact: TFact) => RuleFinding;
}

export async function evaluateRule<TFact>(rule: RuleDefinition<TFact>): Promise<RuleFinding[]> {
  const facts = await rule.loadFacts();
  return facts.filter(rule.condition).map(rule.toFinding);
}

/**
 * Chaque règle a son propre type de fait (`TFact`), donc on ne peut pas les stocker dans un seul
 * tableau générique sans perdre la sûreté de typage — on passe plutôt des évaluateurs déjà liés
 * à leur règle (`() => evaluateRule(rule)`), produits par `createDefaultRules`.
 */
export async function evaluateRules(evaluators: (() => Promise<RuleFinding[]>)[]): Promise<RuleFinding[]> {
  const results = await Promise.all(evaluators.map((run) => run()));
  return results.flat();
}
