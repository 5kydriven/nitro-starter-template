import type { Config } from 'drizzle-kit';
import { useRuntimeConfig } from 'nitropack/runtime';

const config = useRuntimeConfig();

export default {
	schema: './src/db/schema',
	out: './src/db/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: config.supabaseUrl,
	},
} satisfies Config;
