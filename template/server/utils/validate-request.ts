import { createError } from 'h3';
import { ZodType } from 'zod';

export async function validateRequest<T>(
	object: unknown,
	schema: ZodType<T>,
): Promise<T> {
	const result = schema.safeParse(object);

	if (!result.success) {
		const fieldErrors: Record<string, string> = {};

		for (const issue of result.error.issues) {
			const field = issue.path.join('.') || 'form';
			if (!fieldErrors[field]) {
				fieldErrors[field] = issue.message;
			}
		}

		throw createError({
			statusCode: 400,
			statusMessage: 'Bad Request',
			message: 'Validation failed',
			data: fieldErrors,
		});
	}

	return result.data;
}
