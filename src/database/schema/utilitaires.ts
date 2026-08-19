import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  level: text('level', { enum: ['info', 'attention', 'important', 'critique'] }).notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  domain: text('domain'),
  refType: text('ref_type'),
  refId: integer('ref_id'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  groupKey: text('group_key'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const backups = sqliteTable('backups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filePath: text('file_path').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  checksum: text('checksum').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const backupMetadata = sqliteTable('backup_metadata', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  backupId: integer('backup_id').notNull().references(() => backups.id),
  appVersion: text('app_version').notNull(),
  dbVersion: integer('db_version').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: integer('entity_id'),
  before: text('before'),
  after: text('after'),
  source: text('source', { enum: ['user', 'ai', 'system'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const wishlistItems = sqliteTable('wishlist_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  price: real('price'),
  currency: text('currency').notNull().default('MGA'),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).notNull().default('medium'),
  category: text('category'),
  plannedDate: integer('planned_date', { mode: 'timestamp_ms' }),
  budgetAvailable: real('budget_available'),
  isPurchased: integer('is_purchased', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tags: text('tags'),
  category: text('category'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // Soft link to notes — cross-concern, no enforced FK.
  noteId: integer('note_id'),
  filePath: text('file_path').notNull(),
  mimeType: text('mime_type'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const ocrItems = sqliteTable('ocr_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  documentId: integer('document_id').references(() => documents.id),
  rawText: text('raw_text'),
  detectedAmount: real('detected_amount'),
  detectedCategory: text('detected_category'),
  // Soft link to finance.transactions — cross-domain, no enforced FK.
  transactionId: integer('transaction_id'),
  status: text('status', { enum: ['pending', 'confirmed', 'rejected'] }).notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const automationRules = sqliteTable('automation_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  trigger: text('trigger').notNull(),
  condition: text('condition'),
  action: text('action').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});
