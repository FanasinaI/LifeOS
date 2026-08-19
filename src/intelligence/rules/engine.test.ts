import { evaluateRule, evaluateRules, type RuleDefinition } from './engine';

interface Fact {
  id: number;
  value: number;
}

function makeRule(overrides: Partial<RuleDefinition<Fact>> = {}): RuleDefinition<Fact> {
  return {
    id: 'test_rule',
    description: 'a test rule',
    loadFacts: async () => [
      { id: 1, value: 5 },
      { id: 2, value: 95 },
      { id: 3, value: 50 },
    ],
    condition: (fact) => fact.value > 80,
    toFinding: (fact) => ({
      ruleId: 'test_rule',
      domain: 'test',
      severity: 'attention',
      title: 'High value',
      message: `Fact ${fact.id} is high (${fact.value})`,
      dataRef: { factId: fact.id },
    }),
    ...overrides,
  };
}

describe('evaluateRule', () => {
  it('only produces findings for facts that satisfy the condition', async () => {
    const findings = await evaluateRule(makeRule());
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toContain('Fact 2 is high');
  });

  it('produces no findings when nothing matches', async () => {
    const findings = await evaluateRule(makeRule({ condition: () => false }));
    expect(findings).toEqual([]);
  });

  it('produces one finding per matching fact', async () => {
    const findings = await evaluateRule(makeRule({ condition: () => true }));
    expect(findings).toHaveLength(3);
  });
});

describe('evaluateRules', () => {
  it('flattens findings across multiple rule evaluators', async () => {
    const ruleA = makeRule({ id: 'rule_a' });
    const ruleB = makeRule({ id: 'rule_b', condition: (fact) => fact.value < 10 });

    const findings = await evaluateRules([() => evaluateRule(ruleA), () => evaluateRule(ruleB)]);

    expect(findings).toHaveLength(2);
    expect(findings.map((f) => f.message)).toEqual(
      expect.arrayContaining([expect.stringContaining('Fact 2'), expect.stringContaining('Fact 1')])
    );
  });

  it('returns an empty array when there are no evaluators', async () => {
    expect(await evaluateRules([])).toEqual([]);
  });
});
