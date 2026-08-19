import type { InferSelectModel } from 'drizzle-orm';

import { timelineEventsRepository } from '@/database/repositories';
import type { timelineEvents } from '@/database/schema/organisation';

export type TimelineEvent = InferSelectModel<typeof timelineEvents>;

/**
 * Point de repère temporel pour le contexte OODA (§9) — appelé par les autres modules quand un
 * événement notable se produit (transaction, tâche terminée, séance de sport...). L'intégration
 * effective des autres modules vers `recordTimelineEvent` arrive avec l'étape 6 (OODA) plutôt
 * que d'être rétrofittée module par module ici.
 */
export function recordTimelineEvent(
  domain: string,
  refType: string,
  title: string,
  refId?: number | null,
  occurredAt: Date = new Date()
): Promise<TimelineEvent> {
  return timelineEventsRepository.insert({
    occurredAt,
    domain,
    refType,
    refId: refId ?? null,
    title,
    createdAt: new Date(),
  });
}

export function listTimelineBetween(start: Date, end: Date): Promise<TimelineEvent[]> {
  return timelineEventsRepository.findBetween(start, end);
}
