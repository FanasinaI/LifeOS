import { eq } from 'drizzle-orm';
import type { AnySQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';

import { db } from '../client';

type TableWithId = SQLiteTable & { id: AnySQLiteColumn };

/**
 * Uniform CRUD for a Drizzle table. This is the only layer allowed to import the Drizzle query
 * builder directly (see CLAUDE.md) — modules/services/intelligence/ai all go through
 * repositories, never `db` itself.
 */
export function createRepository<T extends TableWithId>(table: T) {
  return {
    findAll: (): Promise<T['$inferSelect'][]> => db.select().from(table),

    findById: async (id: number): Promise<T['$inferSelect'] | undefined> => {
      const rows = await db.select().from(table).where(eq(table.id, id));
      return rows[0];
    },

    insert: async (values: T['$inferInsert']): Promise<T['$inferSelect']> => {
      const rows = await db.insert(table).values(values).returning();
      return rows[0];
    },

    update: async (
      id: number,
      values: Partial<T['$inferInsert']>
    ): Promise<T['$inferSelect'] | undefined> => {
      const rows = await db.update(table).set(values).where(eq(table.id, id)).returning();
      return rows[0];
    },

    remove: (id: number) => db.delete(table).where(eq(table.id, id)),
  };
}
