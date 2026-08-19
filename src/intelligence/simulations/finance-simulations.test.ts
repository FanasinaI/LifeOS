import { simulateDailySaving, simulateNewGoal, simulateNewSubscription } from './finance-simulations';

describe('simulateDailySaving', () => {
  it('multiplies the daily amount by the number of days', () => {
    const result = simulateDailySaving(1000, 30);
    expect(result.financeImpact.total).toBe(30_000);
    expect(result.summary).toContain('30000.00');
  });
});

describe('simulateNewSubscription', () => {
  it('projects a monthly subscription to its annual cost', () => {
    const result = simulateNewSubscription(10_000, 'monthly');
    expect(result.financeImpact.yearlyImpact).toBe(120_000);
    expect(result.financeImpact.monthlyEquivalent).toBe(10_000);
  });

  it('projects a weekly subscription to its annual cost', () => {
    const result = simulateNewSubscription(1_000, 'weekly');
    expect(result.financeImpact.yearlyImpact).toBe(52_000);
  });

  it('leaves a yearly subscription unchanged', () => {
    const result = simulateNewSubscription(50_000, 'yearly');
    expect(result.financeImpact.yearlyImpact).toBe(50_000);
  });
});

describe('simulateNewGoal', () => {
  it('computes the required daily/weekly/monthly pace toward the target', () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 10);

    const result = simulateNewGoal({
      currentAmount: 0,
      targetAmount: 1000,
      targetDate,
      currency: 'MGA',
    });

    expect(result.financeImpact.remaining).toBe(1000);
    expect(result.financeImpact.perDay).toBeCloseTo(100, 5);
  });

  it('reports no pace when the goal has no target amount or date', () => {
    const result = simulateNewGoal({
      currentAmount: 0,
      targetAmount: null,
      targetDate: null,
      currency: 'MGA',
    });
    expect(result.financeImpact).toEqual({});
    expect(result.summary).toContain('Pas d\'échéance');
  });
});
