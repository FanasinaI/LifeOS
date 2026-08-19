import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const aiSessions = sqliteTable('ai_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
  summary: text('summary'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const aiModels = sqliteTable('ai_models', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  sizeMb: integer('size_mb'),
  isInstalled: integer('is_installed', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  lastVerifiedAt: integer('last_verified_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

// Visible/modifiable/supprimable par l'utilisateur — jamais une source de vérité chiffrée.
export const aiMemory = sqliteTable('ai_memory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kind: text('kind', { enum: ['preference', 'goal_context', 'decision', 'planning'] }).notNull(),
  key: text('key').notNull(),
  value: text('value').notNull(),
  isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

// Contenu indexé pour le RAG local. Une table virtuelle FTS5 (ai_knowledge_fts) est créée en
// dehors de Drizzle (drizzle-kit ne gère pas les virtual tables) — voir src/database/client.ts.
export const aiKnowledgeChunks = sqliteTable('ai_knowledge_chunks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourceType: text('source_type', { enum: ['note', 'document'] }).notNull(),
  sourceId: integer('source_id').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
