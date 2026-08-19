// Fonctions statistiques pures (§9 Analytics Engine) — aucune dépendance DB, testables isolément.

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = average(values);
  const variance = average(values.map((v) => (v - mean) ** 2));
  return Math.sqrt(variance);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export interface TrendPoint {
  x: number;
  y: number;
}

export interface Trend {
  slope: number;
  intercept: number;
  direction: 'up' | 'down' | 'flat';
}

/** Régression linéaire simple (moindres carrés) — sert de "prévision locale" basique. */
export function linearTrend(points: TrendPoint[]): Trend {
  if (points.length < 2) return { slope: 0, intercept: points[0]?.y ?? 0, direction: 'flat' };

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  const direction = slope > 0.01 ? 'up' : slope < -0.01 ? 'down' : 'flat';
  return { slope, intercept, direction };
}

export function zScore(value: number, mean: number, stdDev: number): number {
  return stdDev === 0 ? 0 : (value - mean) / stdDev;
}

export interface Anomaly<T> {
  item: T;
  value: number;
  zScore: number;
}

/** Anomalies (§9) : valeurs à plus de `zThreshold` écarts-types de la moyenne. */
export function detectAnomalies<T>(items: T[], getValue: (item: T) => number, zThreshold = 2): Anomaly<T>[] {
  const values = items.map(getValue);
  if (values.length < 3) return [];

  const mean = average(values);
  const stdDev = standardDeviation(values);
  if (stdDev === 0) return [];

  return items
    .map((item, i) => ({ item, value: values[i], zScore: zScore(values[i], mean, stdDev) }))
    .filter((a) => Math.abs(a.zScore) >= zThreshold);
}

/** Comparaison prudente à un historique (§9) — pas de corrélation causale, juste un écart relatif. */
export function compareToHistorical(current: number, historical: number[]): { diffPercent: number; isAboveAverage: boolean } {
  const historicalAverage = average(historical);
  if (historicalAverage === 0) return { diffPercent: 0, isAboveAverage: false };
  const diffPercent = (current - historicalAverage) / historicalAverage;
  return { diffPercent, isAboveAverage: current > historicalAverage };
}
