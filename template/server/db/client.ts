import { drizzle } from 'drizzle-orm/postgres-js';
import { useRuntimeConfig } from 'nitropack/runtime';
import postgres from 'postgres';

const config = useRuntimeConfig();

const client = postgres(config.supabaseUrl, { ssl: 'require' });

const db = drizzle(client);

export default db;
