import type { InferSelectModel } from 'drizzle-orm';

import { insightsRepository } from '@/database/repositories';
import type { insights } from '@/database/schema/intelligence';
import { createDefaultRules, evaluateRules } from '@/intelligence/rules';
import { notify } from '@/modules/notifications';

export type Insight = InferSelectModel<typeof insights>;

function extractRefId(dataRef: Record<string, unknown> | undefined): number | undefined {
  if (!dataRef) return undefined;
  const value = Object.values(dataRef).find((v) => typeof v === 'number');
  return typeof value === 'number' ? value : undefined;
}

/**
 * §22 Explicabilité : chaque insight généré par le Rules Engine garde sa source (toujours
 * `rules_engine` ici — déterministe), sa méthode (l'id de règle) et une confiance de 1 puisque
 * ce ne sont pas des probabilités statistiques mais des faits vérifiés. Chaque insight déclenche
 * aussi une notification (§21) — l'anti-spam de `notify()` évite les doublons si un cycle OODA
 * tourne plusieurs fois sur la même situation.
 */
export async function generateInsights(asOf: Date = new Date()): Promise<Insight[]> {
  const findings = await evaluateRules(createDefaultRules(asOf));

  return Promise.all(
    findings.map(async (finding) => {
      const insight = await insightsRepository.insert({
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
      });

      await notify({
        level: finding.severity,
        title: finding.title,
        body: finding.message,
        domain: finding.domain,
        refType: finding.ruleId,
        refId: extractRefId(finding.dataRef),
      });

      return insight;
    })
  );
}

export function listUnreadInsights(): Promise<Insight[]> {
  return insightsRepository.findAll().then((all) => all.filter((i) => !i.isRead));
}

export async function markInsightRead(insightId: number): Promise<void> {
  await insightsRepository.update(insightId, { isRead: true });
}
