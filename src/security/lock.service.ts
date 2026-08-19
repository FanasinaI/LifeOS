import { AppState, type AppStateStatus } from 'react-native';

import { settingsRepository } from '@/database/repositories';

const LOCK_TIMEOUT_SETTING_KEY = 'security.lock_timeout_ms';
export const DEFAULT_LOCK_TIMEOUT_MS = 60_000;

export async function getLockTimeoutMs(): Promise<number> {
  const row = await settingsRepository.findByKey(LOCK_TIMEOUT_SETTING_KEY);
  const parsed = row ? Number(row.value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_LOCK_TIMEOUT_MS;
}

export async function setLockTimeoutMs(timeoutMs: number): Promise<void> {
  await settingsRepository.setValue(LOCK_TIMEOUT_SETTING_KEY, String(timeoutMs));
}

/**
 * Verrouillage auto (§26) : si l'app reste en arrière-plan plus longtemps que `timeoutMs`,
 * `onLock` est appelé au retour au premier plan. Retourne une fonction de désabonnement.
 */
export function watchAutoLock(onLock: () => void, timeoutMs: number): () => void {
  let backgroundedAt: number | null = null;

  function handleChange(state: AppStateStatus) {
    if (state === 'background' || state === 'inactive') {
      backgroundedAt = Date.now();
    } else if (state === 'active') {
      if (backgroundedAt != null && Date.now() - backgroundedAt >= timeoutMs) {
        onLock();
      }
      backgroundedAt = null;
    }
  }

  const subscription = AppState.addEventListener('change', handleChange);
  return () => subscription.remove();
}
