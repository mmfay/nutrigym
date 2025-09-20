// lib/utils/date.ts

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
