import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const carePlans = pgTable(
  'care_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    petId: text('pet_id').notNull(),
    title: text('title').notNull(),
    plan: jsonb('plan').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [index('care_plans_pet_id_created_at_idx').on(table.petId, table.createdAt)]
);
