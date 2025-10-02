import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user-schema';

export const auth_users = pgTable('auth_users', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id),
	passwordHash: text('password_hash').notNull(),
	lastLogin: timestamp('last_login'),
	createdAt: timestamp('created_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id),
	refreshToken: text('refresh_token').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
});
