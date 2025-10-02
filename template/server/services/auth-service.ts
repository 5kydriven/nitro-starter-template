import { users } from '~/db/schema/user-schema';
import { auth_users } from '~/db/schema/auth-schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db } from '~/db';

export async function register({
	email,
	password,
	fullName,
}: {
	email: string;
	password: string;
	fullName: string;
}) {
	const existing = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	if (existing.length > 0) throw new Error('Email already registered');

	const [user] = await db.insert(users).values({ fullName, email }).returning();

	const hash = await bcrypt.hash(password, 12);
	await db.insert(auth_users).values({ userId: user.id, passwordHash: hash });

	return user;
}
