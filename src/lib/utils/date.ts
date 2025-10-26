/**
 * Helper DateTime Functions
 */
import { Input } from "../dataTypes";

/**
 * Returns today's date as YYYY-MM-DD string in the *local* timezone.
 * Example: "2025-09-20"
 */
export function todayLocalISO(): string {
	const d = new Date();
	const tzOff = d.getTimezoneOffset(); // minutes difference from UTC
	const local = new Date(d.getTime() - tzOff * 60000);
	return local.toISOString().slice(0, 10);
}

/**
 * Splits an ISO date string (YYYY-MM-DD) into parts.
 * Example: "2025-09-20" => { y: "2025", m: "09", d: "20" }
 */
export function splitISO(iso: string) {
	const [y, m, d] = iso.split("-").map((s) => s || "");
	return { y, m, d };
}

/**
 * Checks if a string is a valid YYYY-MM-DD ISO date.
 */
export function isValidISODate(str: string): boolean {
	const t = Date.parse(str);
	return !Number.isNaN(t) && /^\d{4}-\d{2}-\d{2}$/.test(str);
}

/**
 * returns input as Date Type
 */
export function parseAsLocalDate(input: Input): Date {

	if (input instanceof Date) return input;

	if (typeof input === "number") return new Date(input);

	// If "YYYY-MM-DD", build a local date (no timezone jump)
	const m = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);

	if (m) {
		const [_, y, mo, d] = m;
		return new Date(Number(y), Number(mo) - 1, Number(d));
	}

	// Fallback to native parsing for other formats
	return new Date(input);
}

/**
 * takes a "YYYY-MM-DD" date and returns as "Oct 12, 2025" date
 */
export function formatShortDate(input: Input, opts?: { timeZone?: string }): string {

	const date = parseAsLocalDate(input);

	const formatter = new Intl.DateTimeFormat("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
		...(opts?.timeZone ? { timeZone: opts.timeZone } : {})
	});
	return formatter.format(date);
}