import {
    pgTable,
    uuid,
    text,
    timestamp,
    boolean,
    jsonb,
    index
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================================================
// Projects Table
// ============================================================================
export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    userId: uuid('user_id'), // Optional for now, will add auth later
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('idx_projects_user').on(table.userId),
])

// ============================================================================
// Modules Table
// ============================================================================
export const modules = pgTable('modules', {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    verilogCode: text('verilog_code'),
    fsmGraph: jsonb('fsm_graph'), // FSM state machine representation
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    index('idx_modules_project').on(table.projectId),
])

// ============================================================================
// Prompt History Table
// ============================================================================
export const promptHistory = pgTable('prompt_history', {
    id: uuid('id').primaryKey().defaultRandom(),
    moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
    prompt: text('prompt').notNull(),
    generatedCode: text('generated_code'),
    accepted: boolean('accepted').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
    index('idx_prompts_module').on(table.moduleId),
    index('idx_prompts_created').on(table.createdAt),
])

// ============================================================================
// Validation Cache Table
// ============================================================================
export const validationCache = pgTable('validation_cache', {
    moduleId: uuid('module_id').primaryKey().references(() => modules.id, { onDelete: 'cascade' }),
    lintResults: jsonb('lint_results'),
    simulationResults: jsonb('simulation_results'),
    lastValidated: timestamp('last_validated').defaultNow().notNull(),
})

// ============================================================================
// Relations
// ============================================================================
export const projectsRelations = relations(projects, ({ many }) => ({
    modules: many(modules),
}))

export const modulesRelations = relations(modules, ({ one, many }) => ({
    project: one(projects, {
        fields: [modules.projectId],
        references: [projects.id],
    }),
    prompts: many(promptHistory),
    validation: one(validationCache, {
        fields: [modules.id],
        references: [validationCache.moduleId],
    }),
}))

export const promptHistoryRelations = relations(promptHistory, ({ one }) => ({
    module: one(modules, {
        fields: [promptHistory.moduleId],
        references: [modules.id],
    }),
}))

export const validationCacheRelations = relations(validationCache, ({ one }) => ({
    module: one(modules, {
        fields: [validationCache.moduleId],
        references: [modules.id],
    }),
}))

// ============================================================================
// Type Exports
// ============================================================================
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert

export type Module = typeof modules.$inferSelect
export type NewModule = typeof modules.$inferInsert

export type PromptHistory = typeof promptHistory.$inferSelect
export type NewPromptHistory = typeof promptHistory.$inferInsert

export type ValidationCache = typeof validationCache.$inferSelect
export type NewValidationCache = typeof validationCache.$inferInsert
