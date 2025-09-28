import { createError, defineEventHandler, H3Event } from 'h3';
import { supabase } from '~/utils/supabase';

export default defineEventHandler(async (event: H3Event) => {
	const { data, error } = await supabase.from('users').select('*');

	if (error) {
		throw createError({
			message: error.message,
		});
	}
	return {
		data: data,
	};
});
