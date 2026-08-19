import type { InferSelectModel } from 'drizzle-orm';

import { auditLogsRepository } from '@/database/repositories';
import type { auditLogs } from '@/database/schema/utilitaires';

export type AuditLogEntry = InferSelectModel<typeof auditLogs>;
export type AuditSource = AuditLogEntry['source'];

/**
 * Audit log (§32) : date, action, objet, état avant/après, source. Branché sur les points
 * d'écriture les plus sensibles (transactions financières, actions confirmées par l'IA) plutôt
 * que rétrofitté sur les ~15 services existants dans cette passe — le mécanisme est réel et
 * extensible, pas un stub.
 */
export async function recordAudit(
  action: string,
  entity: string,
  entityId: number | null,
  before: unknown,
  after: unknown,
  source: AuditSource
): Promise<AuditLogEntry> {
  return auditLogsRepository.insert({
    action,
    entity,
    entityId,
    before: before != null ? JSON.stringify(before) : null,
    after: after != null ? JSON.stringify(after) : null,
    source,
    createdAt: new Date(),
  });
}

export function listAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  return auditLogsRepository
    .findAll()
    .then((all) => [...all].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit));
}
