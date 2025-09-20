function snakeToCamel(str: string): string {
	return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelToSnake(str: string): string {
	return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function convertKeysToCamelCase(obj: any): any {
	if (Array.isArray(obj)) {
		return obj.map(convertKeysToCamelCase);
	} else if (obj !== null && typeof obj === 'object') {
		return Object.fromEntries(
			Object.entries(obj).map(([key, value]) => [
				snakeToCamel(key),
				convertKeysToCamelCase(value),
			]),
		);
	}

	return obj;
}

export function convertKeysToSnakeCase(obj: any): any {
	if (Array.isArray(obj)) {
		return obj.map(convertKeysToSnakeCase);
	} else if (obj !== null && typeof obj === 'object') {
		return Object.fromEntries(
			Object.entries(obj).map(([key, value]) => [
				camelToSnake(key),
				convertKeysToSnakeCase(value),
			]),
		);
	}

	return obj;
}
