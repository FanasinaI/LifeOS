import { exchangeRatesRepository } from '@/database/repositories';

export class MissingExchangeRateError extends Error {
  constructor(from: string, to: string) {
    super(`Aucun taux de change local disponible pour ${from} → ${to}.`);
    this.name = 'MissingExchangeRateError';
  }
}

/**
 * Taux base->quote le plus récent connu localement (à `asOf` près, par défaut maintenant).
 * Essaie l'inverse (quote->base) si la paire directe n'a jamais été enregistrée.
 * Offline-first (§27) : jamais d'appel réseau, uniquement le dernier taux stocké en base.
 */
export async function getRate(from: string, to: string, asOf?: Date): Promise<number> {
  if (from === to) return 1;

  const direct = await exchangeRatesRepository.findLatest(from, to, asOf);
  if (direct) return direct.rate;

  const inverse = await exchangeRatesRepository.findLatest(to, from, asOf);
  if (inverse && inverse.rate !== 0) return 1 / inverse.rate;

  throw new MissingExchangeRateError(from, to);
}

export async function convert(amount: number, from: string, to: string, asOf?: Date): Promise<number> {
  const rate = await getRate(from, to, asOf);
  return amount * rate;
}
