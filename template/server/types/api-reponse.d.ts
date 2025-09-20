export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
	pages: number;
}

export interface ApiResponse<T> {
	success: boolean;
	message: string;
	data?: T;
	error?: any;
	pagination?: PaginationMeta;
	timestamp: string;
}
