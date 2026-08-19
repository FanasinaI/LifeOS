import type { InferSelectModel } from 'drizzle-orm';

import { timeSessionsRepository } from '@/database/repositories';
import type { timeSessions } from '@/database/schema/organisation';

export type TimeSession = InferSelectModel<typeof timeSessions>;
export type TimeCategory = TimeSession['category'];

export function findActiveSession(): Promise<TimeSession | undefined> {
  return timeSessionsRepository.findActive();
}

export function listRecentSessions(limit = 20): Promise<TimeSession[]> {
  return timeSessionsRepository.findRecent(limit);
}

export async function startSession(
  label: string,
  category: TimeCategory,
  taskId?: number | null,
  plannedMinutes?: number | null
): Promise<TimeSession> {
  const active = await timeSessionsRepository.findActive();
  if (active) throw new Error('Une session est déjà en cours — arrête-la avant d\'en démarrer une autre.');

  return timeSessionsRepository.insert({
    label,
    category,
    taskId: taskId ?? null,
    startAt: new Date(),
    endAt: null,
    plannedMinutes: plannedMinutes ?? null,
    actualMinutes: null,
    createdAt: new Date(),
  });
}

export async function stopSession(sessionId: number): Promise<TimeSession | undefined> {
  const session = await timeSessionsRepository.findById(sessionId);
  if (!session || session.endAt) return session;

  const endAt = new Date();
  const actualMinutes = Math.round((endAt.getTime() - session.startAt.getTime()) / 60_000);
  return timeSessionsRepository.update(sessionId, { endAt, actualMinutes });
}
