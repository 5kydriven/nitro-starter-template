import { defineEventHandler, getHeader, createError } from 'h3';
import jwt from 'jsonwebtoken';
import { useRuntimeConfig } from 'nitropack/runtime';

export default defineEventHandler((event) => {
	const url = event.node.req.url || '';

	if (url.startsWith('/api/v1/auth')) return;

	const config = useRuntimeConfig();

	const authHeader = getHeader(event, 'authorization');
	if (!authHeader) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Missing Authorization header',
		});
	}

	const token = authHeader.replace('Bearer ', '');

	try {
		const decoded = jwt.verify(token, config.jwtSecret);
		event.context.user = decoded;
	} catch (err) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Invalid or expired token',
		});
	}
});
