import {
	createError,
	defineEventHandler,
	H3Event,
	setResponseStatus,
} from 'h3';
import z from 'zod';
import { readRequest } from '~/utils/read-request';
import { successResponse } from '~/utils/response';
import { supabase } from '~/utils/supabase';
import { validateRequest } from '~/utils/validate-request';

const schema = z.object({
	email: z.email('Email must be a valid email').nonempty('Email is required'),
	password: z.string().min(6, 'Password is required'),
	name: z.string().min(1, 'Name is required'),
});

export default defineEventHandler(async (event: H3Event) => {
	const request = await readRequest(event);
	const parse = await validateRequest(request, schema);

	const { data, error } = await supabase.auth.signUp({
		email: parse.email,
		password: parse.password,
		options: {
			data: {
				name: parse.name,
			},
		},
	});

	if (error) {
		throw createError({
			statusCode: error.status,
			message: error.message,
		});
	}

	setResponseStatus(event, 201);
	return successResponse({
		data: data.user,
		message: 'Successfully created user',
	});
});
