import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { organizations } from './organizations';
import { departments } from './departments';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'present',
  'absent',
  'leave',
  'holiday',
  'half_day',
]);

export const leaveRequestStatusEnum = pgEnum('leave_request_status', [
  'pending',
  'approved',
  'rejected',
]);

export const overtimeRequestStatusEnum = pgEnum('overtime_request_status', [
  'pending',
  'approved',
  'rejected',
]);

// ─── Attendance Settings ─────────────────────────────────────────────────────

export const attendanceSettings = pgTable('attendance_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  departmentId: uuid('department_id').references(() => departments.id),
  workStartTime: varchar('work_start_time', { length: 10 }).notNull(),
  workEndTime: varchar('work_end_time', { length: 10 }).notNull(),
  gracePeriodMinutes: integer('grace_period_minutes').default(15).notNull(),
  halfDayHours: numeric('half_day_hours'),
  overtimeMinimumMinutes: integer('overtime_minimum_minutes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const attendanceSettingsRelations = relations(
  attendanceSettings,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [attendanceSettings.organizationId],
      references: [organizations.id],
    }),
    department: one(departments, {
      fields: [attendanceSettings.departmentId],
      references: [departments.id],
    }),
  })
);

// ─── Attendance Records ──────────────────────────────────────────────────────

export const attendanceRecords = pgTable('attendance_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  date: date('date').notNull(),
  clockIn: timestamp('clock_in'),
  clockOut: timestamp('clock_out'),
  isLate: boolean('is_late').default(false),
  lateMinutes: integer('late_minutes'),
  isEarlyLeave: boolean('is_early_leave').default(false),
  earlyLeaveMinutes: integer('early_leave_minutes'),
  overtimeMinutes: integer('overtime_minutes'),
  status: attendanceStatusEnum('status').default('present').notNull(),
  rawData: jsonb('raw_data'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const attendanceRecordsRelations = relations(
  attendanceRecords,
  ({ one }) => ({
    user: one(users, {
      fields: [attendanceRecords.userId],
      references: [users.id],
    }),
  })
);

// ─── Leave Types ─────────────────────────────────────────────────────────────

export const leaveTypes = pgTable('leave_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  maxDaysPerYear: integer('max_days_per_year'),
  isPaid: boolean('is_paid').default(true),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leaveTypesRelations = relations(leaveTypes, ({ one }) => ({
  organization: one(organizations, {
    fields: [leaveTypes.organizationId],
    references: [organizations.id],
  }),
}));

// ─── Leave Requests ──────────────────────────────────────────────────────────

export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  leaveTypeId: uuid('leave_type_id')
    .notNull()
    .references(() => leaveTypes.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  reason: text('reason'),
  status: leaveRequestStatusEnum('status').default('pending').notNull(),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  user: one(users, {
    fields: [leaveRequests.userId],
    references: [users.id],
    relationName: 'leaveRequestUser',
  }),
  leaveType: one(leaveTypes, {
    fields: [leaveRequests.leaveTypeId],
    references: [leaveTypes.id],
  }),
  approver: one(users, {
    fields: [leaveRequests.approvedBy],
    references: [users.id],
    relationName: 'leaveRequestApprover',
  }),
}));

// ─── Overtime Requests ───────────────────────────────────────────────────────

export const overtimeRequests = pgTable('overtime_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  date: date('date').notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }).notNull(),
  hours: numeric('hours').notNull(),
  reason: text('reason'),
  status: overtimeRequestStatusEnum('status').default('pending').notNull(),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const overtimeRequestsRelations = relations(
  overtimeRequests,
  ({ one }) => ({
    user: one(users, {
      fields: [overtimeRequests.userId],
      references: [users.id],
      relationName: 'overtimeRequestUser',
    }),
    approver: one(users, {
      fields: [overtimeRequests.approvedBy],
      references: [users.id],
      relationName: 'overtimeRequestApprover',
    }),
  })
);
