import {
  average,
  clamp,
  compareToHistorical,
  detectAnomalies,
  linearTrend,
  median,
  standardDeviation,
  zScore,
} from './stats';

describe('average', () => {
  it('returns 0 for an empty array', () => {
    expect(average([])).toBe(0);
  });

  it('computes the mean', () => {
    expect(average([1, 2, 3, 4])).toBe(2.5);
  });
});

describe('median', () => {
  it('returns 0 for an empty array', () => {
    expect(median([])).toBe(0);
  });

  it('returns the middle value for an odd-length array', () => {
    expect(median([5, 1, 3])).toBe(3);
  });

  it('averages the two middle values for an even-length array', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe('standardDeviation', () => {
  it('is 0 for identical values', () => {
    expect(standardDeviation([5, 5, 5])).toBe(0);
  });

  it('matches the known population standard deviation', () => {
    // mean 5, variance 4, stdDev 2
    expect(standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2, 5);
  });
});

describe('clamp', () => {
  it('clamps below the minimum', () => {
    expect(clamp(-5, 0, 100)).toBe(0);
  });

  it('clamps above the maximum', () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it('passes through in-range values', () => {
    expect(clamp(42, 0, 100)).toBe(42);
  });
});

describe('linearTrend', () => {
  it('reports flat direction with fewer than two points', () => {
    expect(linearTrend([]).direction).toBe('flat');
    expect(linearTrend([{ x: 0, y: 10 }])).toEqual({ slope: 0, intercept: 10, direction: 'flat' });
  });

  it('detects an upward trend on a perfectly increasing series', () => {
    const points = [0, 1, 2, 3, 4].map((x) => ({ x, y: x * 10 }));
    const trend = linearTrend(points);
    expect(trend.direction).toBe('up');
    expect(trend.slope).toBeCloseTo(10, 5);
  });

  it('detects a downward trend', () => {
    const points = [0, 1, 2, 3].map((x) => ({ x, y: 100 - x * 5 }));
    expect(linearTrend(points).direction).toBe('down');
  });

  it('detects a flat trend on a constant series', () => {
    const points = [0, 1, 2, 3].map((x) => ({ x, y: 50 }));
    const trend = linearTrend(points);
    expect(trend.direction).toBe('flat');
    expect(trend.slope).toBeCloseTo(0, 5);
  });
});

describe('zScore', () => {
  it('is 0 when standard deviation is 0 (avoids division by zero)', () => {
    expect(zScore(10, 5, 0)).toBe(0);
  });

  it('computes the standard score', () => {
    expect(zScore(15, 10, 5)).toBe(1);
  });
});

describe('detectAnomalies', () => {
  it('returns nothing with fewer than 3 items', () => {
    expect(detectAnomalies([1, 2], (v) => v)).toEqual([]);
  });

  it('returns nothing when all values are identical', () => {
    expect(detectAnomalies([10, 10, 10, 10], (v) => v)).toEqual([]);
  });

  it('flags a clear outlier', () => {
    const values = [10, 11, 9, 10, 12, 100];
    const anomalies = detectAnomalies(values, (v) => v, 2);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].value).toBe(100);
  });
});

describe('compareToHistorical', () => {
  it('reports 0 diff with an empty history', () => {
    expect(compareToHistorical(50, [])).toEqual({ diffPercent: 0, isAboveAverage: false });
  });

  it('computes the relative difference to the historical average', () => {
    const result = compareToHistorical(150, [100, 100, 100]);
    expect(result.diffPercent).toBeCloseTo(0.5, 5);
    expect(result.isAboveAverage).toBe(true);
  });
});
