import type { InferSelectModel } from 'drizzle-orm';

import { aiModelsRepository } from '@/database/repositories';
import type { aiModels } from '@/database/schema/ai';

export type AiModel = InferSelectModel<typeof aiModels>;

/**
 * Métadonnées des modèles connus (§19) — le téléchargement/l'exécution réelle d'un modèle
 * dépend du choix d'un runtime (llama.rn, MLC...), non encore branché. Cette table permet déjà
 * à l'UI de savoir honnêtement "aucun modèle installé" plutôt que de le supposer.
 */
export function listModels(): Promise<AiModel[]> {
  return aiModelsRepository.findAll();
}

export async function getActiveModel(): Promise<AiModel | undefined> {
  const all = await aiModelsRepository.findAll();
  return all.find((m) => m.isActive && m.isInstalled);
}

export async function registerModel(name: string, sizeMb?: number): Promise<AiModel> {
  return aiModelsRepository.insert({
    name,
    sizeMb: sizeMb ?? null,
    isInstalled: false,
    isActive: false,
    lastVerifiedAt: null,
    createdAt: new Date(),
  });
}

export async function setModelInstalled(modelId: number, installed: boolean): Promise<AiModel | undefined> {
  return aiModelsRepository.update(modelId, { isInstalled: installed, lastVerifiedAt: new Date() });
}

export async function activateModel(modelId: number): Promise<void> {
  const all = await aiModelsRepository.findAll();
  await Promise.all(
    all
      .filter((m) => m.isActive && m.id !== modelId)
      .map((m) => aiModelsRepository.update(m.id, { isActive: false }))
  );
  await aiModelsRepository.update(modelId, { isActive: true });
}

export async function removeModel(modelId: number): Promise<void> {
  await aiModelsRepository.remove(modelId);
}
