import { assetsRepository, debtsRepository } from '@/database/repositories';
import { convert } from '@/utils/currency';

import { computeCurrentValue } from './assets.service';

export interface NetWorth {
  totalAssets: number;
  totalDebts: number;
  netWorth: number;
  currency: string;
}

/**
 * Patrimoine net = actifs (possessions) − dettes (§7), converti dans `targetCurrency` au dernier
 * taux local connu. Ne prend volontairement pas en compte les soldes des comptes MONEY (déjà
 * visibles dans l'onglet comptes) — cette vue reste fidèle à la définition du CDC.
 */
export async function computeNetWorth(targetCurrency: string, asOf: Date = new Date()): Promise<NetWorth> {
  const [assets, debts] = await Promise.all([assetsRepository.findAll(), debtsRepository.findAll()]);

  let totalAssets = 0;
  for (const asset of assets) {
    const value = computeCurrentValue(asset, asOf);
    totalAssets += await convert(value, asset.currency, targetCurrency, asOf);
  }

  let totalDebts = 0;
  for (const debt of debts) {
    if (debt.status === 'paid') continue;
    totalDebts += await convert(debt.remaining, debt.currency, targetCurrency, asOf);
  }

  return { totalAssets, totalDebts, netWorth: totalAssets - totalDebts, currency: targetCurrency };
}
