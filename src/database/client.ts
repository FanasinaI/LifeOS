import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

import * as schema from './schema';

export const DB_NAME = 'lifeos.db';
/** Bumped whenever the schema changes in a way backups/restores need to know about. */
export const DB_VERSION = 1;

export const sqliteConnection = SQLite.openDatabaseSync(DB_NAME);

export const db = drizzle(sqliteConnection, { schema });

/**
 * FTS5 virtual table backing the local RAG search (src/ai/rag). drizzle-kit / drizzle-orm's
 * migrator don't model virtual tables or triggers, so this is bootstrapped separately with raw
 * SQL, guarded by IF NOT EXISTS so it's safe to re-run on every app start right after migrations.
 */
export async function ensureSearchIndex(): Promise<void> {
  await sqliteConnection.execAsync(`
    CREATE VIRTUAL TABLE IF NOT EXISTS ai_knowledge_fts USING fts5(
      content,
      content='ai_knowledge_chunks',
      content_rowid='id'
    );

    CREATE TRIGGER IF NOT EXISTS ai_knowledge_chunks_ai AFTER INSERT ON ai_knowledge_chunks BEGIN
      INSERT INTO ai_knowledge_fts(rowid, content) VALUES (new.id, new.content);
    END;

    CREATE TRIGGER IF NOT EXISTS ai_knowledge_chunks_ad AFTER DELETE ON ai_knowledge_chunks BEGIN
      INSERT INTO ai_knowledge_fts(ai_knowledge_fts, rowid, content) VALUES ('delete', old.id, old.content);
    END;

    CREATE TRIGGER IF NOT EXISTS ai_knowledge_chunks_au AFTER UPDATE ON ai_knowledge_chunks BEGIN
      INSERT INTO ai_knowledge_fts(ai_knowledge_fts, rowid, content) VALUES ('delete', old.id, old.content);
      INSERT INTO ai_knowledge_fts(rowid, content) VALUES (new.id, new.content);
    END;
  `);
}
