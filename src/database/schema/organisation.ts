import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const goals = sqliteTable('goals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  domain: text('domain', {
    enum: ['financial', 'school', 'professional', 'sport', 'personal', 'material'],
  }).notNull(),
  targetAmount: real('target_amount'),
  currentAmount: real('current_amount').notNull().default(0),
  currency: text('currency').notNull().default('MGA'),
  targetDate: integer('target_date', { mode: 'timestamp_ms' }),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).notNull().default('medium'),
  status: text('status', { enum: ['active', 'completed', 'abandoned'] }).notNull().default('active'),
  // Soft link to finance.budgets — cross-domain, no enforced FK to avoid cross-file cycles.
  budgetId: integer('budget_id'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const goalContributions = sqliteTable('goal_contributions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  goalId: integer('goal_id').notNull().references(() => goals.id),
  amount: real('amount').notNull(),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', { enum: ['active', 'completed', 'archived'] }).notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  projectId: integer('project_id').references(() => projects.id),
  goalId: integer('goal_id').references(() => goals.id),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).notNull().default('medium'),
  dueDate: integer('due_date', { mode: 'timestamp_ms' }),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull().default(false),
  recurrenceRule: text('recurrence_rule'),
  estimatedMinutes: integer('estimated_minutes'),
  status: text('status', { enum: ['todo', 'in_progress', 'done', 'cancelled'] })
    .notNull()
    .default('todo'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const subtasks = sqliteTable('subtasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').notNull().references(() => tasks.id),
  title: text('title').notNull(),
  isDone: integer('is_done', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  startAt: integer('start_at', { mode: 'timestamp_ms' }).notNull(),
  endAt: integer('end_at', { mode: 'timestamp_ms' }).notNull(),
  location: text('location'),
  note: text('note'),
  isAllDay: integer('is_all_day', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const habits = sqliteTable('habits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  cadence: text('cadence', { enum: ['daily', 'weekly', 'custom'] }).notNull(),
  targetPerPeriod: integer('target_per_period').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const habitLogs = sqliteTable('habit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  habitId: integer('habit_id').notNull().references(() => habits.id),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  isDone: integer('is_done', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const timeSessions = sqliteTable('time_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  category: text('category', { enum: ['work', 'study', 'sport', 'leisure'] }).notNull(),
  taskId: integer('task_id').references(() => tasks.id),
  startAt: integer('start_at', { mode: 'timestamp_ms' }).notNull(),
  endAt: integer('end_at', { mode: 'timestamp_ms' }),
  plannedMinutes: integer('planned_minutes'),
  actualMinutes: integer('actual_minutes'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const timelineEvents = sqliteTable('timeline_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  occurredAt: integer('occurred_at', { mode: 'timestamp_ms' }).notNull(),
  domain: text('domain').notNull(),
  refType: text('ref_type').notNull(),
  refId: integer('ref_id'),
  title: text('title').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
