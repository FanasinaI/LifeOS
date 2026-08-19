import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// HEALTH — sport, nutrition, hydratation. Pas de sommeil : décision produit figée (voir CLAUDE.md).

export const exercises = sqliteTable('exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const workouts = sqliteTable('workouts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const workoutSets = sqliteTable('workout_sets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workoutId: integer('workout_id').notNull().references(() => workouts.id),
  exerciseId: integer('exercise_id').notNull().references(() => exercises.id),
  setIndex: integer('set_index').notNull(),
  reps: integer('reps').notNull(),
  weight: real('weight'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const foods = sqliteTable('foods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  caloriesPer100g: real('calories_per_100g').notNull(),
  proteinPer100g: real('protein_per_100g').notNull().default(0),
  carbsPer100g: real('carbs_per_100g').notNull().default(0),
  fatPer100g: real('fat_per_100g').notNull().default(0),
  fiberPer100g: real('fiber_per_100g').default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const meals = sqliteTable('meals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  type: text('type', { enum: ['breakfast', 'lunch', 'dinner', 'snack'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const mealItems = sqliteTable('meal_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  mealId: integer('meal_id').notNull().references(() => meals.id),
  foodId: integer('food_id').notNull().references(() => foods.id),
  grams: real('grams').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const waterLogs = sqliteTable('water_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  amountMl: real('amount_ml').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
