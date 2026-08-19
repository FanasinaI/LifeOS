import type { InferSelectModel } from 'drizzle-orm';

import { insightsRepository } from '@/database/repositories';
import type { insights } from '@/database/schema/intelligence';
import { createDefaultRules, evaluateRules } from '@/intelligence/rules';

export type Insight = InferSelectModel<typeof insights>;

/**
 * §22 Explicabilité : chaque insight généré par le Rules Engine garde sa source (toujours
 * `rules_engine` ici — déterministe), sa méthode (l'id de règle) et une confiance de 1 puisque
 * ce ne sont pas des probabilités statistiques mais des faits vérifiés.
 */
export async function generateInsights(asOf: Date = new Date()): Promise<Insight[]> {
  const findings = await evaluateRules(createDefaultRules(asOf));

  return Promise.all(
    findings.map((finding) =>
      insightsRepository.insert({
        domain: finding.domain,
        severity: finding.severity,
        title: finding.title,
        message: finding.message,
        source: 'rules_engine',
        method: finding.ruleId,
        confidence: 1,
        dataRef: finding.dataRef ? JSON.stringify(finding.dataRef) : null,
        isRead: false,
        createdAt: new Date(),
      })
    )
  );
}

export function listUnreadInsights(): Promise<Insight[]> {
  return insightsRepository.findAll().then((all) => all.filter((i) => !i.isRead));
}

export async function markInsightRead(insightId: number): Promise<void> {
  await insightsRepository.update(insightId, { isRead: true });
}
