import { foodsRepository } from '@/database/repositories';

import type { Food } from './macros';

export function listFoods(): Promise<Food[]> {
  return foodsRepository.findAll();
}

export interface CreateFoodInput {
  name: string;
  caloriesPer100g: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  fiberPer100g?: number;
}

export function createFood(input: CreateFoodInput): Promise<Food> {
  return foodsRepository.insert({
    name: input.name,
    caloriesPer100g: input.caloriesPer100g,
    proteinPer100g: input.proteinPer100g ?? 0,
    carbsPer100g: input.carbsPer100g ?? 0,
    fatPer100g: input.fatPer100g ?? 0,
    fiberPer100g: input.fiberPer100g ?? 0,
    createdAt: new Date(),
  });
}
