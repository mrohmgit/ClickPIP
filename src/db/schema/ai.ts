import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { organizations } from './organizations';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const aiGuardrailScopeEnum = pgEnum('ai_guardrail_scope', [
  'organization',
  'department',
  'role',
  'individual',
]);

export const aiGuardrailRuleTypeEnum = pgEnum('ai_guardrail_rule_type', [
  'monitor_metric',
  'alert_threshold',
  'recommendation_trigger',
]);

export const aiAlertSeverityEnum = pgEnum('ai_alert_severity', [
  'info',
  'warning',
  'critical',
]);

export const aiChatRoleEnum = pgEnum('ai_chat_role', [
  'user',
  'assistant',
  'system',
]);

// ─── AI Knowledge Documents ─────────────────────────────────────────────────

export const aiKnowledgeDocuments = pgTable('ai_knowledge_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }),
  content: text('content'),
  category: varchar('category', { length: 255 }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  uploadedBy: uuid('uploaded_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiKnowledgeDocumentsRelations = relations(
  aiKnowledgeDocuments,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [aiKnowledgeDocuments.organizationId],
      references: [organizations.id],
    }),
    uploader: one(users, {
      fields: [aiKnowledgeDocuments.uploadedBy],
      references: [users.id],
    }),
    embeddings: many(aiEmbeddings),
  })
);

// ─── AI Embeddings ───────────────────────────────────────────────────────────
// NOTE: The `embedding` column uses pgvector's vector(1536) type.
// Ensure the pgvector extension is enabled in your database:
//   CREATE EXTENSION IF NOT EXISTS vector;
// The column is defined as text here to avoid build-time dependency on pgvector.
// For production, consider using a custom column type or drizzle-orm/pg-core customType.

export const aiEmbeddings = pgTable('ai_embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id')
    .notNull()
    .references(() => aiKnowledgeDocuments.id),
  chunkText: text('chunk_text').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  embedding: text('embedding'), // pgvector vector(1536) — see note above
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiEmbeddingsRelations = relations(aiEmbeddings, ({ one }) => ({
  document: one(aiKnowledgeDocuments, {
    fields: [aiEmbeddings.documentId],
    references: [aiKnowledgeDocuments.id],
  }),
}));

// ─── AI Guardrails ───────────────────────────────────────────────────────────

export const aiGuardrails = pgTable('ai_guardrails', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  scope: aiGuardrailScopeEnum('scope').notNull(),
  scopeId: varchar('scope_id', { length: 255 }),
  ruleType: aiGuardrailRuleTypeEnum('rule_type').notNull(),
  conditions: jsonb('conditions'),
  actions: jsonb('actions'),
  isActive: boolean('is_active').default(true).notNull(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const aiGuardrailsRelations = relations(
  aiGuardrails,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [aiGuardrails.organizationId],
      references: [organizations.id],
    }),
    alerts: many(aiAlerts),
  })
);

// ─── AI Alerts ───────────────────────────────────────────────────────────────

export const aiAlerts = pgTable('ai_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  guardrailId: uuid('guardrail_id')
    .notNull()
    .references(() => aiGuardrails.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  severity: aiAlertSeverityEnum('severity').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  recommendation: text('recommendation'),
  data: jsonb('data'),
  isRead: boolean('is_read').default(false).notNull(),
  isResolved: boolean('is_resolved').default(false).notNull(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiAlertsRelations = relations(aiAlerts, ({ one }) => ({
  guardrail: one(aiGuardrails, {
    fields: [aiAlerts.guardrailId],
    references: [aiGuardrails.id],
  }),
  user: one(users, {
    fields: [aiAlerts.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [aiAlerts.organizationId],
    references: [organizations.id],
  }),
}));

// ─── AI Chat Sessions ───────────────────────────────────────────────────────

export const aiChatSessions = pgTable('ai_chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  title: varchar('title', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const aiChatSessionsRelations = relations(
  aiChatSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [aiChatSessions.userId],
      references: [users.id],
    }),
    messages: many(aiChatMessages),
  })
);

// ─── AI Chat Messages ───────────────────────────────────────────────────────

export const aiChatMessages = pgTable('ai_chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => aiChatSessions.id),
  role: aiChatRoleEnum('role').notNull(),
  content: text('content').notNull(),
  sources: jsonb('sources'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const aiChatMessagesRelations = relations(aiChatMessages, ({ one }) => ({
  session: one(aiChatSessions, {
    fields: [aiChatMessages.sessionId],
    references: [aiChatSessions.id],
  }),
}));
