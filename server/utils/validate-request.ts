import { H3Event, readBody, readMultipartFormData } from 'h3';
import { ZodTypeAny } from 'zod';

export interface UploadedFile {
	field: string;
	filename: string;
	mimetype: string;
	data: Buffer;
}

/**
 * Reads request body (JSON or multipart) and validates against a Zod schema
 */
export async function validateRequest<T>(
	event: H3Event,
	schema: ZodTypeAny,
): Promise<{ data: T; files: UploadedFile[] }> {
	let body: Record<string, unknown> = {};
	const files: UploadedFile[] = [];

	// Try multipart/form-data
	const formData = await readMultipartFormData(event);
	if (formData) {
		for (const item of formData) {
			if (item.type) {
				// File field
				files.push({
					field: item.name ?? 'file', // fallback if name is undefined
					filename: item.filename ?? 'unknown',
					mimetype: item.type,
					data: item.data,
				});
			} else if (item.name) {
				// Regular text field
				body[item.name] = item.data.toString();
			}
		}
	} else {
		// Otherwise JSON
		body = await readBody(event);
	}

	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		throw {
			statusCode: 400,
			message: 'Validation failed',
			errors: parsed.error.flatten(),
		};
	}

	return { data: parsed.data as T, files };
}
