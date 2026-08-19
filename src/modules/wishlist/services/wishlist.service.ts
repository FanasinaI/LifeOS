import type { InferSelectModel } from 'drizzle-orm';

import { wishlistItemsRepository } from '@/database/repositories';
import type { wishlistItems } from '@/database/schema/utilitaires';

export type WishlistItem = InferSelectModel<typeof wishlistItems>;

export interface CreateWishlistItemInput {
  name: string;
  price?: number | null;
  currency?: string;
  priority?: WishlistItem['priority'];
  category?: string | null;
  plannedDate?: Date | null;
  budgetAvailable?: number | null;
}

export async function createWishlistItem(input: CreateWishlistItemInput): Promise<WishlistItem> {
  const now = new Date();
  return wishlistItemsRepository.insert({
    name: input.name,
    price: input.price ?? null,
    currency: input.currency ?? 'MGA',
    priority: input.priority ?? 'medium',
    category: input.category ?? null,
    plannedDate: input.plannedDate ?? null,
    budgetAvailable: input.budgetAvailable ?? null,
    isPurchased: false,
    createdAt: now,
    updatedAt: now,
  });
}

export async function listWishlist(includePurchased = false): Promise<WishlistItem[]> {
  const all = await wishlistItemsRepository.findAll();
  const filtered = includePurchased ? all : all.filter((item) => !item.isPurchased);
  return [...filtered].sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'high' ? -1 : 1));
}

export async function markPurchased(itemId: number): Promise<WishlistItem | undefined> {
  return wishlistItemsRepository.update(itemId, { isPurchased: true, updatedAt: new Date() });
}

export async function deleteWishlistItem(itemId: number): Promise<void> {
  await wishlistItemsRepository.remove(itemId);
}
