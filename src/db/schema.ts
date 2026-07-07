import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

// Define the 'users' table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'notes' table (representing Google Keep styles or synchronized workspace notes)
export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').default(''),
  content: text('content').notNull(),
  color: text('color').default('slate'), // slate, blue, emerald, amber, pink, etc.
  isPinned: boolean('is_pinned').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define the 'workspace_files' table (representing files picked via the Google Picker/Drive integration)
export const workspaceFiles = pgTable('workspace_files', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  fileId: text('file_id').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  webViewLink: text('web_view_link'),
  iconLink: text('icon_link'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relationships for the 'users' table
export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  workspaceFiles: many(workspaceFiles),
}));

// Define relationships for the 'notes' table
export const notesRelations = relations(notes, ({ one }) => ({
  author: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
}));

// Define relationships for the 'workspace_files' table
export const workspaceFilesRelations = relations(workspaceFiles, ({ one }) => ({
  author: one(users, {
    fields: [workspaceFiles.userId],
    references: [users.id],
  }),
}));
