import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

export const insights = sqliteTable('insights', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  domain: text('domain').notNull(),
  severity: text('severity', { enum: ['info', 'attention', 'important', 'critique'] }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  source: text('source').notNull(),
  method: text('method').notNull(),
  confidence: real('confidence'),
  // JSON-encoded reference to the data points that produced this insight (explicabilité).
  dataRef: text('data_ref'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const simulations = sqliteTable('simulations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', {
    enum: ['purchase', 'income_drop', 'saving', 'subscription', 'goal', 'debt', 'repayment'],
  }).notNull(),
  label: text('label').notNull(),
  inputParams: text('input_params').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const simulationResults = sqliteTable('simulation_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  simulationId: integer('simulation_id').notNull().references(() => simulations.id),
  scenarioLabel: text('scenario_label').notNull(),
  financeImpact: text('finance_impact').notNull(),
  timeImpact: text('time_impact'),
  goalsImpact: text('goals_impact'),
  lifeScoreImpact: real('life_score_impact'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const decisions = sqliteTable('decisions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  situation: text('situation').notNull(),
  optionsConsidered: text('options_considered').notNull(),
  simulationId: integer('simulation_id').references(() => simulations.id),
  chosenOption: text('chosen_option').notNull(),
  reason: text('reason'),
  expectedResult: text('expected_result'),
  actualResult: text('actual_result'),
  decidedAt: integer('decided_at', { mode: 'timestamp_ms' }).notNull(),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const oodaCycles = sqliteTable('ooda_cycles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  observeSummary: text('observe_summary'),
  orientSummary: text('orient_summary'),
  decision: text('decision'),
  action: text('action'),
  resultSummary: text('result_summary'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
