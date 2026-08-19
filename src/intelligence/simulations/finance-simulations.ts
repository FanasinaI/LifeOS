import { accountsRepository, debtsRepository, transactionsRepository } from '@/database/repositories';
import { annualCost, type Subscription } from '@/modules/finance';
import { computeRequiredPace, type PaceInput } from '@/modules/goals';
import { addDays } from '@/utils/date';

export interface ScenarioResult {
  label: string;
  financeImpact: Record<string, number>;
  summary: string;
}

/**
 * §10 Simulation Engine — calcul pur, en lecture seule sur l'état actuel. N'écrit jamais dans
 * les tables réelles (accounts/transactions/goals/...) ; seule `runSimulation` (orchestrator.ts)
 * enregistre la simulation elle-même dans le journal `simulations`/`simulation_results`.
 */
export async function simulatePurchase(accountId: number, amount: number): Promise<ScenarioResult> {
  const balance = await accountsRepository.computeBalance(accountId);
  const balanceAfter = balance - amount;
  return {
    label: `Achat de ${amount}`,
    financeImpact: { balanceBefore: balance, balanceAfter, amount },
    summary:
      balanceAfter < 0
        ? `Solde négatif après achat : ${balanceAfter.toFixed(2)}.`
        : `Solde après achat : ${balanceAfter.toFixed(2)}.`,
  };
}

/** Baisse (ou hausse) de revenu mensuel récurrent, projetée sur `months` mois à partir du solde actuel. */
export async function simulateIncomeChange(
  accountId: number,
  monthlyDelta: number,
  months: number
): Promise<ScenarioResult> {
  const balance = await accountsRepository.computeBalance(accountId);
  const projectedBalance = balance + monthlyDelta * months;
  return {
    label: `${monthlyDelta >= 0 ? 'Hausse' : 'Baisse'} de revenu de ${Math.abs(monthlyDelta)}/mois`,
    financeImpact: { balanceBefore: balance, projectedBalance, months, monthlyDelta },
    summary: `Après ${months} mois : ${projectedBalance.toFixed(2)} (delta cumulé ${(monthlyDelta * months).toFixed(2)}).`,
  };
}

export function simulateDailySaving(dailyAmount: number, days: number): ScenarioResult {
  const total = dailyAmount * days;
  return {
    label: `Épargne de ${dailyAmount}/jour`,
    financeImpact: { dailyAmount, days, total },
    summary: `${total.toFixed(2)} épargnés au bout de ${days} jours.`,
  };
}

export function simulateNewSubscription(amount: number, frequency: Subscription['frequency']): ScenarioResult {
  const yearly = annualCost({ amount, frequency });
  return {
    label: `Nouvel abonnement (${frequency})`,
    financeImpact: { amount, yearlyImpact: yearly, monthlyEquivalent: yearly / 12 },
    summary: `Coût annuel estimé : ${yearly.toFixed(2)} (≈ ${(yearly / 12).toFixed(2)}/mois).`,
  };
}

export function simulateNewGoal(goal: PaceInput & { currency: string }): ScenarioResult {
  const pace = computeRequiredPace(goal);
  return {
    label: 'Nouvel objectif',
    financeImpact: pace
      ? { remaining: pace.remaining, perDay: pace.perDay, perWeek: pace.perWeek, perMonth: pace.perMonth }
      : {},
    summary: pace
      ? `${pace.perDay.toFixed(2)} ${goal.currency}/jour requis pour tenir l'échéance.`
      : "Pas d'échéance ou de montant cible défini.",
  };
}

export async function simulateDebtRepayment(debtId: number, monthlyPayment: number): Promise<ScenarioResult> {
  const debt = await debtsRepository.findById(debtId);
  if (!debt || monthlyPayment <= 0) {
    return { label: 'Remboursement de dette', financeImpact: {}, summary: 'Dette introuvable ou paiement invalide.' };
  }
  const monthsToPayoff = Math.ceil(debt.remaining / monthlyPayment);
  const payoffDate = addDays(new Date(), monthsToPayoff * 30);
  return {
    label: `Remboursement de ${monthlyPayment}/mois`,
    financeImpact: { remaining: debt.remaining, monthlyPayment, monthsToPayoff },
    summary: `Dette soldée dans ~${monthsToPayoff} mois (vers ${payoffDate.toLocaleDateString('fr-FR')}).`,
  };
}

/** Moyenne des flux nets confirmés (revenus − dépenses) des 30 derniers jours — base pour les projections. */
export async function estimateAverageDailyNetFlow(asOf: Date = new Date()): Promise<number> {
  const all = await transactionsRepository.findAll();
  const cutoff = addDays(asOf, -30).getTime();
  const recent = all.filter((t) => t.status === 'confirmed' && t.date.getTime() >= cutoff);
  const net = recent.reduce((sum, t) => {
    if (t.type === 'income' || t.type === 'refund') return sum + t.amount;
    if (t.type === 'expense') return sum - t.amount;
    return sum;
  }, 0);
  return net / 30;
}
