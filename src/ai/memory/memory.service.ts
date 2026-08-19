import type { InferSelectModel } from 'drizzle-orm';

import { aiMemoryRepository } from '@/database/repositories';
import type { aiMemory } from '@/database/schema/ai';

export type AiMemoryEntry = InferSelectModel<typeof aiMemory>;

/** Visible/modifiable/supprimable par l'utilisateur (§14) — jamais une source de vérité chiffrée. */
export function listMemory(): Promise<AiMemoryEntry[]> {
  return aiMemoryRepository.findAll();
}

export async function setMemory(
  kind: AiMemoryEntry['kind'],
  key: string,
  value: string
): Promise<AiMemoryEntry> {
  const all = await aiMemoryRepository.findAll();
  const existing = all.find((m) => m.kind === kind && m.key === key);
  const now = new Date();

  if (existing) {
    return (await aiMemoryRepository.update(existing.id, { value, updatedAt: now }))!;
  }
  return aiMemoryRepository.insert({ kind, key, value, isVisible: true, createdAt: now, updatedAt: now });
}

export async function deleteMemory(id: number): Promise<void> {
  await aiMemoryRepository.remove(id);
}

export function setMemoryVisibility(id: number, isVisible: boolean): Promise<AiMemoryEntry | undefined> {
  return aiMemoryRepository.update(id, { isVisible, updatedAt: new Date() });
}
