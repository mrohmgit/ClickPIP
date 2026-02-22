import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  date,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { organizations } from './organizations';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const pipStatusEnum = pgEnum('pip_status', [
  'active',
  'completed',
  'failed',
  'pending',
  'extended',
]);

export const pipResultEnum = pgEnum('pip_result', ['passed', 'failed']);

export const pipGoalStatusEnum = pgEnum('pip_goal_status', [
  'pending',
  'in_progress',
  'achieved',
  'not_achieved',
]);

// ─── PIP Records ─────────────────────────────────────────────────────────────

export const pipRecords = pgTable('pip_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => users.id),
  managerId: uuid('manager_id')
    .notNull()
    .references(() => users.id),
  status: pipStatusEnum('status').default('pending').notNull(),
  duration: integer('duration').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  reason: text('reason'),
  overallRating: integer('overall_rating'),
  result: pipResultEnum('result'),
  resultNote: text('result_note'),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pipRecordsRelations = relations(pipRecords, ({ one, many }) => ({
  employee: one(users, {
    fields: [pipRecords.employeeId],
    references: [users.id],
    relationName: 'pipEmployee',
  }),
  manager: one(users, {
    fields: [pipRecords.managerId],
    references: [users.id],
    relationName: 'pipManager',
  }),
  organization: one(organizations, {
    fields: [pipRecords.organizationId],
    references: [organizations.id],
  }),
  goals: many(pipGoals),
  checkins: many(pipCheckins),
  comments: many(pipComments),
  evaluations: many(pipEvaluations),
}));

// ─── PIP Goals ───────────────────────────────────────────────────────────────

export const pipGoals = pgTable('pip_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipId: uuid('pip_id')
    .notNull()
    .references(() => pipRecords.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  kpiTarget: varchar('kpi_target', { length: 255 }),
  kpiUnit: varchar('kpi_unit', { length: 100 }),
  currentValue: numeric('current_value'),
  targetValue: numeric('target_value'),
  rating: integer('rating'),
  status: pipGoalStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pipGoalsRelations = relations(pipGoals, ({ one }) => ({
  pipRecord: one(pipRecords, {
    fields: [pipGoals.pipId],
    references: [pipRecords.id],
  }),
}));

// ─── PIP Check-ins ───────────────────────────────────────────────────────────

export const pipCheckins = pgTable('pip_checkins', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipId: uuid('pip_id')
    .notNull()
    .references(() => pipRecords.id),
  weekNumber: integer('week_number').notNull(),
  date: date('date').notNull(),
  managerNote: text('manager_note'),
  employeeNote: text('employee_note'),
  goalUpdates: jsonb('goal_updates'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pipCheckinsRelations = relations(pipCheckins, ({ one }) => ({
  pipRecord: one(pipRecords, {
    fields: [pipCheckins.pipId],
    references: [pipRecords.id],
  }),
  creator: one(users, {
    fields: [pipCheckins.createdBy],
    references: [users.id],
  }),
}));

// ─── PIP Comments ────────────────────────────────────────────────────────────

export const pipComments = pgTable('pip_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipId: uuid('pip_id')
    .notNull()
    .references(() => pipRecords.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pipCommentsRelations = relations(pipComments, ({ one }) => ({
  pipRecord: one(pipRecords, {
    fields: [pipComments.pipId],
    references: [pipRecords.id],
  }),
  user: one(users, {
    fields: [pipComments.userId],
    references: [users.id],
  }),
}));

// ─── PIP Evaluations ────────────────────────────────────────────────────────

export const pipEvaluations = pgTable('pip_evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipId: uuid('pip_id')
    .notNull()
    .references(() => pipRecords.id),
  evaluatorId: uuid('evaluator_id')
    .notNull()
    .references(() => users.id),
  goalRatings: jsonb('goal_ratings'),
  overallRating: integer('overall_rating'),
  result: pipResultEnum('result'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pipEvaluationsRelations = relations(pipEvaluations, ({ one }) => ({
  pipRecord: one(pipRecords, {
    fields: [pipEvaluations.pipId],
    references: [pipRecords.id],
  }),
  evaluator: one(users, {
    fields: [pipEvaluations.evaluatorId],
    references: [users.id],
  }),
}));

// ─── PIP Templates ───────────────────────────────────────────────────────────

export const pipTemplates = pgTable('pip_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  duration: integer('duration').notNull(),
  goalsTemplate: jsonb('goals_template'),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pipTemplatesRelations = relations(pipTemplates, ({ one }) => ({
  organization: one(organizations, {
    fields: [pipTemplates.organizationId],
    references: [organizations.id],
  }),
}));
