// db/index.ts
import * as schema from './schema';

import { Pool } from 'pg';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';

import { drizzle as supaDrizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// import { Database } from 'sqlite3';
// import { drizzle as sqliteDrizzle } from 'drizzle-orm/sqlite3';

import { useRuntimeConfig } from 'nitropack/runtime';

type DBClients = 'postgres' | 'supabase' | 'sqlite';

let db: ReturnType<typeof pgDrizzle> | ReturnType<typeof supaDrizzle>;
// | ReturnType<typeof sqliteDrizzle>;

export function initDB() {
	const config = useRuntimeConfig();

	const client = config.dbClient as DBClients;

	if (client === 'postgres') {
		const pool = new Pool({
			connectionString: process.env.DATABASE_URL!,
		});
		db = pgDrizzle(pool, { schema });
	}

	if (client === 'supabase') {
		// Use postgres-js with supabase connection string
		const client = postgres(process.env.SUPABASE_DB_URL!, { ssl: 'require' });
		db = supaDrizzle(client, { schema });
	}

	// if (client === 'sqlite') {
	// 	const sqlite = new Database('local.sqlite');
	// 	db = sqliteDrizzle(sqlite, { schema });
	// }

	if (!db) throw new Error(`Unsupported dbClient: ${client}`);

	return db;
}

// Export initialized db (lazy style)
export { db };
