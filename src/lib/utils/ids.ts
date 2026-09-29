/**
 * Parses a positive integer id from a route param / query string / body value, or null if invalid.
 */
export function parseId(v: unknown): number | null {
	const n = Number(v);
	return Number.isInteger(n) && n > 0 ? n : null;
}