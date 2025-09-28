import { defineEventHandler, H3Event } from 'h3';

export default defineEventHandler(async (event: H3Event) => {
	return {
		message: 'hello world',
	};
});
