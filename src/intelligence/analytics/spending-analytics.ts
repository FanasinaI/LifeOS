import { transactionsRepository } from '@/database/repositories';
import { startOfDay } from '@/utils/date';

import { detectAnomalies, linearTrend, type Anomaly, type Trend } from './stats';

/** Dépenses confirmées des `days` derniers jours, groupées par jour (0 pour les jours sans dépense). */
export async function dailySpending(days = 30, asOf: Date = new Date()): Promise<{ date: Date; amount: number }[]> {
  const all = await transactionsRepository.findAll();
  const cutoff = startOfDay(asOf).getTime() - days * 86_400_000;

  const byDay = new Map<number, number>();
  for (const t of all) {
    if (t.type !== 'expense' || t.status !== 'confirmed') continue;
    const day = startOfDay(t.date).getTime();
    if (day < cutoff) continue;
    byDay.set(day, (byDay.get(day) ?? 0) + t.amount);
  }

  const result: { date: Date; amount: number }[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = startOfDay(asOf).getTime() - i * 86_400_000;
    result.push({ date: new Date(day), amount: byDay.get(day) ?? 0 });
  }
  return result;
}

export async function spendingTrend(days = 30, asOf: Date = new Date()): Promise<Trend> {
  const series = await dailySpending(days, asOf);
  return linearTrend(series.map((point, i) => ({ x: i, y: point.amount })));
}

/** Transactions dont le montant s'écarte fortement des autres dépenses de la même catégorie. */
export async function anomalousTransactions(zThreshold = 2.5) {
  const all = await transactionsRepository.findAll();
  const expenses = all.filter((t) => t.type === 'expense' && t.status === 'confirmed');

  const byCategory = new Map<number | null, typeof expenses>();
  for (const t of expenses) {
    const key = t.categoryId;
    const list = byCategory.get(key) ?? [];
    list.push(t);
    byCategory.set(key, list);
  }

  const anomalies: Anomaly<(typeof expenses)[number]>[] = [];
  for (const list of byCategory.values()) {
    anomalies.push(...detectAnomalies(list, (t) => t.amount, zThreshold));
  }
  return anomalies;
}
