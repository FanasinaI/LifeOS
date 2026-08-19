import { settingsRepository } from '@/database/repositories';

const ONBOARDING_COMPLETE_KEY = 'onboarding.completed';
const PRIMARY_CURRENCY_KEY = 'currency.primary';

export async function isOnboardingComplete(): Promise<boolean> {
  const row = await settingsRepository.findByKey(ONBOARDING_COMPLETE_KEY);
  return row?.value === '1';
}

export async function markOnboardingComplete(): Promise<void> {
  await settingsRepository.setValue(ONBOARDING_COMPLETE_KEY, '1');
}

export async function getPrimaryCurrency(): Promise<string> {
  const row = await settingsRepository.findByKey(PRIMARY_CURRENCY_KEY);
  return row?.value ?? 'MGA';
}

export async function setPrimaryCurrency(currency: string): Promise<void> {
  await settingsRepository.setValue(PRIMARY_CURRENCY_KEY, currency);
}
