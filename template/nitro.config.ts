import { defineNitroConfig } from 'nitropack/config';

// https://nitro.build/config
export default defineNitroConfig({
	compatibilityDate: 'latest',
	srcDir: 'server',
	typescript: {
		strict: true,
	},
	runtimeConfig: {
		supabaseUrl: process.env.NITRO_SUPABASE_URL,
		supabaseAnonKey: process.env.NITRO_SUPABASE_ANON_KEY,
		supabaseRoleKey: process.env.NITRO_SUPABASE_ROLE_KEY,
		jwtSecret: process.env.NITRO_JWT_SECRET,
		dbClient: process.env.NITRO_DB_CLIENT,
		databaseUrl: process.env.NITRO_DATABASE_URL,
	},
});
