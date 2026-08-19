import type { InferSelectModel } from 'drizzle-orm';

import { categoriesRepository } from '@/database/repositories';
import type { categories } from '@/database/schema/finance';

export type Category = InferSelectModel<typeof categories>;

export async function listCategories(kind?: Category['kind']): Promise<Category[]> {
  const all = await categoriesRepository.findAll();
  return kind ? all.filter((c) => c.kind === kind) : all;
}

export interface CreateCategoryInput {
  name: string;
  kind: Category['kind'];
  icon?: string | null;
  color?: string | null;
  parentId?: number | null;
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  return categoriesRepository.insert({
    name: input.name,
    kind: input.kind,
    icon: input.icon ?? null,
    color: input.color ?? null,
    parentId: input.parentId ?? null,
    createdAt: new Date(),
  });
}
