import type { InferSelectModel } from 'drizzle-orm';

import { settingsRepository, waterLogsRepository } from '@/database/repositories';
import type { waterLogs } from '@/database/schema/health';
import { endOfDay, startOfDay } from '@/utils/date';

export type WaterLog = InferSelectModel<typeof waterLogs>;

const DAILY_GOAL_SETTING_KEY = 'hydration.daily_goal_ml';
const DEFAULT_DAILY_GOAL_ML = 2000;

export async function getDailyGoalMl(): Promise<number> {
  const row = await settingsRepository.findByKey(DAILY_GOAL_SETTING_KEY);
  const parsed = row ? Number(row.value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_GOAL_ML;
}

export function setDailyGoalMl(ml: number): Promise<void> {
  return settingsRepository.setValue(DAILY_GOAL_SETTING_KEY, String(ml));
}

export function logWater(amountMl: number, date: Date = new Date()): Promise<WaterLog> {
  return waterLogsRepository.insert({ date, amountMl, createdAt: new Date() });
}

export function listWaterForDay(date: Date = new Date()): Promise<WaterLog[]> {
  return waterLogsRepository.findBetween(startOfDay(date), endOfDay(date));
}

export interface HydrationStatus {
  consumedMl: number;
  goalMl: number;
  percent: number;
}

export async function computeDailyStatus(date: Date = new Date()): Promise<HydrationStatus> {
  const [logs, goalMl] = await Promise.all([listWaterForDay(date), getDailyGoalMl()]);
  const consumedMl = logs.reduce((sum, l) => sum + l.amountMl, 0);
  return { consumedMl, goalMl, percent: goalMl > 0 ? Math.min(consumedMl / goalMl, 1) : 0 };
}
