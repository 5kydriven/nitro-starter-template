import { defineEventHandler, H3Event, setResponseStatus } from 'h3';
import { errorResponse, successResponse } from '~/utils/response';

export default defineEventHandler(async (event: H3Event) => {
	try {
		return successResponse({
			data: event.node,
		});
	} catch (error: any) {
		setResponseStatus(event);
		return errorResponse({ error });
	}
});
