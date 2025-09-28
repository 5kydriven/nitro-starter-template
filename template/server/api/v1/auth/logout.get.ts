import { defineEventHandler, H3Event } from 'h3';
import { supabase } from '~/utils/supabase';

export default defineEventHandler(async (event: H3Event) => {
	await supabase.auth.signOut();

	return {
		success: true,
		message: 'Successfully logged out',
	};
});
