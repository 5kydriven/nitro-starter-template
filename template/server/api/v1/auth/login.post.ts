import { createError, defineEventHandler, H3Event } from 'h3';
import z from 'zod';
import { readRequest } from '~/utils/read-request';
import { successResponse } from '~/utils/response';
import { supabase } from '~/utils/supabase';
import { validateRequest } from '~/utils/validate-request';

const schema = z.object({
	email: z.email('Email must be a valid email').nonempty('Email is required'),
	password: z.string().min(1, 'Password is required'),
});

export default defineEventHandler(async (event: H3Event) => {
	const request = await readRequest(event);
	const pasrse = await validateRequest(request, schema);

	const { data, error } = await supabase.auth.signInWithPassword({
		email: pasrse.email,
		password: pasrse.password,
	});

	if (error) {
		throw createError({
			statusCode: error.status,
			message: error.message,
		});
	}

	return successResponse({
		data: data.session,
		message: 'Successfully logged in',
	});
});
