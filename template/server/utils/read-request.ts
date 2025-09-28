import { H3Event, readFormData, readBody } from 'h3';

export async function readRequest(
	event: H3Event,
): Promise<Record<string, any>> {
	const contentType = event.node.req.headers['content-type'] ?? '';

	if (contentType.includes('multipart/form-data')) {
		const formData = await readFormData(event);
		const obj: Record<string, any> = {};

		formData.forEach((value, key) => {
			obj[key] = value;
		});

		return obj;
	}

	const body = await readBody<Record<string, any>>(event);
	return body ?? {};
}
