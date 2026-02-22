import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  numeric,
  timestamp,
  date,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { organizations } from './organizations';
import { departments } from './departments';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const kpiDataSourceEnum = pgEnum('kpi_data_source', [
  'manual',
  'attendance',
  'tasks',
]);

export const assessmentCycleTypeEnum = pgEnum('assessment_cycle_type', [
  'quarter',
  'half_year',
  'yearly',
]);

export const assessmentCycleStatusEnum = pgEnum('assessment_cycle_status', [
  'draft',
  'open',
  'review',
  'completed',
]);

export const assessmentSubmissionStatusEnum = pgEnum(
  'assessment_submission_status',
  ['pending', 'self_assessed', 'reviewed', 'completed']
);

export const compensationPlanStatusEnum = pgEnum('compensation_plan_status', [
  'draft',
  'proposed',
  'approved',
  'rejected',
]);

// ─── KPI Categories ─────────────────────────────────────────────────────────

export const kpiCategories = pgTable('kpi_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  defaultWeight: numeric('default_weight'),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const kpiCategoriesRelations = relations(
  kpiCategories,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [kpiCategories.organizationId],
      references: [organizations.id],
    }),
    factors: many(departmentKpiFactors),
  })
);

// ─── Department KPI Factors ──────────────────────────────────────────────────

export const departmentKpiFactors = pgTable('department_kpi_factors', {
  id: uuid('id').primaryKey().defaultRandom(),
  departmentId: uuid('department_id')
    .notNull()
    .references(() => departments.id),
  kpiCategoryId: uuid('kpi_category_id')
    .notNull()
    .references(() => kpiCategories.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  weight: numeric('weight').notNull(),
  target: numeric('target'),
  dataSource: kpiDataSourceEnum('data_source').default('manual').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const departmentKpiFactorsRelations = relations(
  departmentKpiFactors,
  ({ one }) => ({
    department: one(departments, {
      fields: [departmentKpiFactors.departmentId],
      references: [departments.id],
    }),
    kpiCategory: one(kpiCategories, {
      fields: [departmentKpiFactors.kpiCategoryId],
      references: [kpiCategories.id],
    }),
  })
);

// ─── Assessment Cycles ───────────────────────────────────────────────────────

export const assessmentCycles = pgTable('assessment_cycles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: assessmentCycleTypeEnum('type').notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  selfAssessmentDeadline: timestamp('self_assessment_deadline'),
  managerReviewDeadline: timestamp('manager_review_deadline'),
  status: assessmentCycleStatusEnum('status').default('draft').notNull(),
  kpiSnapshot: jsonb('kpi_snapshot'),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const assessmentCyclesRelations = relations(
  assessmentCycles,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [assessmentCycles.organizationId],
      references: [organizations.id],
    }),
    submissions: many(assessmentSubmissions),
    compensationPlans: many(compensationPlans),
  })
);

// ─── Assessment Submissions ──────────────────────────────────────────────────

export const assessmentSubmissions = pgTable('assessment_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  cycleId: uuid('cycle_id')
    .notNull()
    .references(() => assessmentCycles.id),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => users.id),
  managerId: uuid('manager_id').references(() => users.id),
  selfScores: jsonb('self_scores'),
  managerScores: jsonb('manager_scores'),
  attendanceSummary: jsonb('attendance_summary'),
  taskSummary: jsonb('task_summary'),
  pipSummary: jsonb('pip_summary'),
  finalScore: numeric('final_score'),
  finalGrade: varchar('final_grade', { length: 10 }),
  status: assessmentSubmissionStatusEnum('status')
    .default('pending')
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const assessmentSubmissionsRelations = relations(
  assessmentSubmissions,
  ({ one }) => ({
    cycle: one(assessmentCycles, {
      fields: [assessmentSubmissions.cycleId],
      references: [assessmentCycles.id],
    }),
    employee: one(users, {
      fields: [assessmentSubmissions.employeeId],
      references: [users.id],
      relationName: 'assessmentEmployee',
    }),
    manager: one(users, {
      fields: [assessmentSubmissions.managerId],
      references: [users.id],
      relationName: 'assessmentManager',
    }),
  })
);

// ─── Compensation Plans ──────────────────────────────────────────────────────

export const compensationPlans = pgTable('compensation_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  assessmentCycleId: uuid('assessment_cycle_id')
    .notNull()
    .references(() => assessmentCycles.id),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => users.id),
  currentSalary: numeric('current_salary'),
  proposedIncreasePercent: numeric('proposed_increase_percent'),
  proposedBonusMonths: numeric('proposed_bonus_months'),
  finalIncreasePercent: numeric('final_increase_percent'),
  finalBonusMonths: numeric('final_bonus_months'),
  status: compensationPlanStatusEnum('status').default('draft').notNull(),
  approvedBy: uuid('approved_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const compensationPlansRelations = relations(
  compensationPlans,
  ({ one }) => ({
    assessmentCycle: one(assessmentCycles, {
      fields: [compensationPlans.assessmentCycleId],
      references: [assessmentCycles.id],
    }),
    employee: one(users, {
      fields: [compensationPlans.employeeId],
      references: [users.id],
      relationName: 'compensationEmployee',
    }),
    approver: one(users, {
      fields: [compensationPlans.approvedBy],
      references: [users.id],
      relationName: 'compensationApprover',
    }),
  })
);
