import type { InferSelectModel } from 'drizzle-orm';

import type { foods } from '@/database/schema/health';

export type Food = InferSelectModel<typeof foods>;

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export function emptyMacros(): Macros {
  return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: a.fiber + b.fiber,
  };
}

/** Macros d'une portion de `grams` grammes, à partir des valeurs pour 100g stockées sur l'aliment. */
export function scaleMacros(food: Food, grams: number): Macros {
  const factor = grams / 100;
  return {
    calories: food.caloriesPer100g * factor,
    protein: food.proteinPer100g * factor,
    carbs: food.carbsPer100g * factor,
    fat: food.fatPer100g * factor,
    fiber: (food.fiberPer100g ?? 0) * factor,
  };
}
