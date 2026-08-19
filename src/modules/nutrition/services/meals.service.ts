import type { InferSelectModel } from 'drizzle-orm';

import { foodsRepository, mealItemsRepository, mealsRepository } from '@/database/repositories';
import type { mealItems, meals } from '@/database/schema/health';
import { endOfDay, startOfDay } from '@/utils/date';

import { addMacros, emptyMacros, scaleMacros, type Macros } from './macros';

export type Meal = InferSelectModel<typeof meals>;
export type MealItem = InferSelectModel<typeof mealItems>;

export function createMeal(type: Meal['type'], date: Date = new Date()): Promise<Meal> {
  return mealsRepository.insert({ date, type, createdAt: new Date() });
}

export function addMealItem(mealId: number, foodId: number, grams: number): Promise<MealItem> {
  return mealItemsRepository.insert({ mealId, foodId, grams, createdAt: new Date() });
}

export function listMealsForDay(date: Date = new Date()): Promise<Meal[]> {
  return mealsRepository.findBetween(startOfDay(date), endOfDay(date));
}

export async function computeMealMacros(mealId: number): Promise<Macros> {
  const items = await mealItemsRepository.findByMeal(mealId);
  if (items.length === 0) return emptyMacros();

  const foods = await foodsRepository.findAll();
  const foodsById = new Map(foods.map((f) => [f.id, f]));

  return items.reduce((total, item) => {
    const food = foodsById.get(item.foodId);
    return food ? addMacros(total, scaleMacros(food, item.grams)) : total;
  }, emptyMacros());
}

export async function computeDailyMacros(date: Date = new Date()): Promise<Macros> {
  const meals = await listMealsForDay(date);
  const perMeal = await Promise.all(meals.map((m) => computeMealMacros(m.id)));
  return perMeal.reduce(addMacros, emptyMacros());
}
