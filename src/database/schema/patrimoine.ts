import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const assets = sqliteTable('assets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').notNull(),
  initialValue: real('initial_value').notNull(),
  currency: text('currency').notNull().default('MGA'),
  acquisitionDate: integer('acquisition_date', { mode: 'timestamp_ms' }).notNull(),
  depreciationRate: real('depreciation_rate').notNull().default(0),
  depreciationMethod: text('depreciation_method', { enum: ['linear', 'none'] })
    .notNull()
    .default('none'),
  usefulLifeMonths: integer('useful_life_months'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const assetDepreciations = sqliteTable('asset_depreciations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  assetId: integer('asset_id').notNull().references(() => assets.id),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  value: real('value').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
