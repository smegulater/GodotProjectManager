export function jsonToConfig(obj: object, sectionPrefix = ''): string {
	const lines: string[] = [];

	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'number') {
			lines.push(`${key}=${value}`);
		} else if (typeof value === 'string') {
			lines.push(value.includes('"') ? `${key}=${value}` : `"${key}=${value}"`);
		} else if (typeof value === 'object' && value !== null) {
			// Nested object — compute full section name
			const sectionName = sectionPrefix ? `${sectionPrefix}.${key}` : key;
			lines.push(`[${sectionName}]`);
			lines.push(jsonToConfig(value as object, sectionName));
		}
	}

	return lines.join('\n');
}
