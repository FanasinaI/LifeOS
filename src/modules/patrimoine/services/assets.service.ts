import type { InferSelectModel } from 'drizzle-orm';

import { assetDepreciationsRepository, assetsRepository } from '@/database/repositories';
import type { assets } from '@/database/schema/patrimoine';

export type Asset = InferSelectModel<typeof assets>;

/** Valeur actuelle d'une possession (dépréciation linéaire, ou valeur initiale si non dépréciée). */
export function computeCurrentValue(asset: Asset, asOf: Date = new Date()): number {
  if (asset.depreciationMethod !== 'linear' || !asset.usefulLifeMonths || asset.usefulLifeMonths <= 0) {
    return asset.initialValue;
  }

  const monthsElapsed =
    (asOf.getFullYear() - asset.acquisitionDate.getFullYear()) * 12 +
    (asOf.getMonth() - asset.acquisitionDate.getMonth());

  const depreciationPerMonth = asset.initialValue / asset.usefulLifeMonths;
  const value = asset.initialValue - depreciationPerMonth * Math.max(monthsElapsed, 0);
  return Math.max(value, 0);
}

export interface CreateAssetInput {
  name: string;
  category: string;
  initialValue: number;
  currency: string;
  acquisitionDate: Date;
  depreciationMethod?: Asset['depreciationMethod'];
  depreciationRate?: number;
  usefulLifeMonths?: number | null;
}

export async function createAsset(input: CreateAssetInput): Promise<Asset> {
  const now = new Date();
  return assetsRepository.insert({
    name: input.name,
    category: input.category,
    initialValue: input.initialValue,
    currency: input.currency,
    acquisitionDate: input.acquisitionDate,
    depreciationMethod: input.depreciationMethod ?? 'none',
    depreciationRate: input.depreciationRate ?? 0,
    usefulLifeMonths: input.usefulLifeMonths ?? null,
    createdAt: now,
    updatedAt: now,
  });
}

/** Enregistre un point de dépréciation historique (pour un graphe d'évolution, par ex.). */
export async function recordDepreciationSnapshot(assetId: number, asOf: Date = new Date()) {
  const asset = await assetsRepository.findById(assetId);
  if (!asset) return undefined;
  const value = computeCurrentValue(asset, asOf);
  return assetDepreciationsRepository.insert({ assetId, date: asOf, value, createdAt: new Date() });
}

export interface AssetWithValue extends Asset {
  currentValue: number;
}

export async function listAssetsWithValues(asOf: Date = new Date()): Promise<AssetWithValue[]> {
  const all = await assetsRepository.findAll();
  return all.map((asset) => ({ ...asset, currentValue: computeCurrentValue(asset, asOf) }));
}
