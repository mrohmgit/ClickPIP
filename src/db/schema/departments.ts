import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  managerId: uuid('manager_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const departmentsRelations = relations(departments, ({ one, many }) => {
  // Import lazily to avoid circular reference
  const { users } = require('./users');
  return {
    organization: one(organizations, {
      fields: [departments.organizationId],
      references: [organizations.id],
    }),
    manager: one(users, {
      fields: [departments.managerId],
      references: [users.id],
    }),
    members: many(users),
  };
});
