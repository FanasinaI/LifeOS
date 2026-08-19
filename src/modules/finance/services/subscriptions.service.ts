import type { InferSelectModel } from 'drizzle-orm';

import { subscriptionsRepository } from '@/database/repositories';
import type { subscriptions } from '@/database/schema/finance';
import { addDays, daysBetween } from '@/utils/date';

export type Subscription = InferSelectModel<typeof subscriptions>;

const OCCURRENCES_PER_YEAR: Record<Subscription['frequency'], number> = {
  weekly: 52,
  monthly: 12,
  yearly: 1,
};

export function annualCost(subscription: Pick<Subscription, 'amount' | 'frequency'>): number {
  return subscription.amount * OCCURRENCES_PER_YEAR[subscription.frequency];
}

/** Échéance dans les `withinDays` prochains jours. */
export async function listUpcoming(withinDays = 7, asOf: Date = new Date()): Promise<Subscription[]> {
  const all = await subscriptionsRepository.findAll();
  const horizon = addDays(asOf, withinDays);
  return all.filter(
    (s) => s.isActive && s.nextDueDate >= asOf && s.nextDueDate <= horizon
  );
}

/**
 * Abonnement "oublié" (§6) : actif, échéance dépassée depuis plus de `graceDays`, et jamais
 * reconfirmé depuis (ou reconfirmé lui aussi avant l'échéance dépassée).
 */
export async function detectForgotten(graceDays = 3, asOf: Date = new Date()): Promise<Subscription[]> {
  const all = await subscriptionsRepository.findAll();
  return all.filter((s) => {
    if (!s.isActive) return false;
    const overdueDays = daysBetween(s.nextDueDate, asOf);
    if (overdueDays < graceDays) return false;
    if (!s.lastConfirmedDate) return true;
    return s.lastConfirmedDate < s.nextDueDate;
  });
}

export async function confirmSubscriptionPayment(
  subscriptionId: number,
  paidOn: Date = new Date()
): Promise<Subscription | undefined> {
  const subscription = await subscriptionsRepository.findById(subscriptionId);
  if (!subscription) return undefined;

  const nextDueDate = advanceDueDate(subscription.nextDueDate, subscription.frequency);
  return subscriptionsRepository.update(subscriptionId, {
    lastConfirmedDate: paidOn,
    nextDueDate,
    updatedAt: new Date(),
  });
}

function advanceDueDate(current: Date, frequency: Subscription['frequency']): Date {
  switch (frequency) {
    case 'weekly':
      return addDays(current, 7);
    case 'monthly': {
      const d = new Date(current);
      d.setMonth(d.getMonth() + 1);
      return d;
    }
    case 'yearly': {
      const d = new Date(current);
      d.setFullYear(d.getFullYear() + 1);
      return d;
    }
  }
}
