import { ApiResponse, PaginationMeta } from '~/types/api-reponse';

export function successResponse<T>({
	data,
	message = 'Request successful',
	page = 1,
	limit = 10,
}: {
	data: T | T[];
	message?: string;
	page?: number;
	limit?: number;
}): ApiResponse<T | T[]> {
	let pagination: PaginationMeta | undefined = undefined;

	if (Array.isArray(data)) {
		const total = data.length;
		const pages = Math.ceil(total / limit);

		const start = (page - 1) * limit;
		const end = start + limit;

		data = data.slice(start, end);

		pagination = { page, limit, total, pages };
	}

	return {
		success: true,
		message,
		data,
		pagination,
		timestamp: new Date().toISOString(),
	};
}

export function errorResponse({
	error,
	message = 'Something went wrong',
}: {
	error: any;
	message?: string;
}): ApiResponse<null> {
	return {
		success: false,
		message,
		error: typeof error === 'string' ? error : String(error),
		timestamp: new Date().toISOString(),
	};
}
