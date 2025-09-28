import { createClient } from '@supabase/supabase-js';
import { Database } from '~/types/database';
import { useRuntimeConfig } from 'nitropack/runtime';

const config = useRuntimeConfig();
const supabaseUrl = config.supabaseUrl;
const supabaseAnonKey = config.supabaseAnonKey;
// const supabaseRoleKey = config.supabaseRoleKey;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
