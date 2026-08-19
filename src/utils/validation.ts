import { z } from 'zod';

// Shared Zod primitives, reused by per-entity form schemas as each module is built
// (src/modules/<domain>) — no point mirroring all 49 tables before there's a form to validate.

export const idSchema = z.number().int().positive();

export const moneyAmountSchema = z.number().finite();

export const positiveMoneyAmountSchema = moneyAmountSchema.positive();

export const currencyCodeSchema = z
  .string()
  .trim()
  .length(3)
  .transform((v) => v.toUpperCase());

export const nonEmptyTextSchema = z.string().trim().min(1);
