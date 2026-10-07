/**
 * Workout display / input helpers
 */
import { ExerciseTargets, TrackingType, WorkoutSet, WorkoutSetInput } from "../dataTypes";

// "full_body" => "Full body"
export function labelize(v: string): string {
	const s = v.replace(/_/g, " ").toLowerCase();
	return s.charAt(0).toUpperCase() + s.slice(1);
}

export const TRACKING_TYPE_LABELS: Record<TrackingType, string> = {
	WEIGHT_REPS: "Weight × reps",
	REPS: "Reps only",
	TIME: "Time",
	DISTANCE_TIME: "Distance + time",
};

/**
 * 75 => "1:15", 3725 => "1:02:05"
 */
export function formatDuration(totalSeconds: number): string {

	const s = Math.max(0, Math.floor(totalSeconds));
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = s % 60;

	const pad = (n: number) => String(n).padStart(2, "0");

	return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;

}

/**
 * Accepts "90", "1:30" or "1:02:05" and returns seconds, or null if unparseable.
 */
export function parseDuration(input: string): number | null {

	const v = input.trim();
	if (!v) return null;

	const parts = v.split(":");
	if (parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return null;

	return parts.reduce((acc, p) => acc * 60 + Number(p), 0);

}

const num = (v: number | null | undefined) => (v === null || v === undefined ? null : Number(v));

/**
 * Human readable set, e.g. "185 lb × 8", "12 reps", "1:30", "3.1 mi in 25:00"
 */
export function formatSet(set: Pick<WorkoutSet, "weight" | "reps" | "duration_seconds" | "distance">, tracking: TrackingType): string {

	const weight = num(set.weight);
	const reps = num(set.reps);
	const duration = num(set.duration_seconds);
	const distance = num(set.distance);

	switch (tracking) {
		case "WEIGHT_REPS":
			if (weight !== null && reps !== null) return `${weight} lb × ${reps}`;
			if (reps !== null) return `${reps} reps`;
			return weight !== null ? `${weight} lb` : "—";
		case "REPS":
			return reps !== null ? `${reps} reps${weight ? ` (+${weight} lb)` : ""}` : "—";
		case "TIME":
			return duration !== null ? formatDuration(duration) : "—";
		case "DISTANCE_TIME": {
			const d = distance !== null ? `${distance} mi` : null;
			const t = duration !== null ? formatDuration(duration) : null;
			return [d, t].filter(Boolean).join(" in ") || "—";
		}
	}

}

/**
 * Human readable template / session targets, e.g. "3 × 8 @ 135 lb", "3 × 0:45"
 */
export function formatTargets(t: ExerciseTargets, tracking: TrackingType): string {

	if (!t.target_sets) return "";

	const sets = `${t.target_sets} ×`;
	const reps = num(t.target_reps);
	const weight = num(t.target_weight);
	const duration = num(t.target_duration_seconds);

	if (tracking === "TIME" || tracking === "DISTANCE_TIME") {
		return duration ? `${sets} ${formatDuration(duration)}` : `${t.target_sets} sets`;
	}

	if (!reps) return `${t.target_sets} sets`;

	return `${sets} ${reps}${weight ? ` @ ${weight} lb` : ""}`;

}

// the text inputs for logging a set
export type SetDraft = {
	weight: string;
	reps: string;
	duration: string;
	distance: string;
};

export const EMPTY_SET_DRAFT: SetDraft = { weight: "", reps: "", duration: "", distance: "" };

export function draftFromSet(set: Pick<WorkoutSet, "weight" | "reps" | "duration_seconds" | "distance">): SetDraft {
	return {
		weight: set.weight !== null ? String(Number(set.weight)) : "",
		reps: set.reps !== null ? String(set.reps) : "",
		duration: set.duration_seconds !== null ? formatDuration(set.duration_seconds) : "",
		distance: set.distance !== null ? String(Number(set.distance)) : "",
	};
}

export function draftFromTargets(t: ExerciseTargets): SetDraft {
	return {
		weight: t.target_weight !== null ? String(Number(t.target_weight)) : "",
		reps: t.target_reps !== null ? String(t.target_reps) : "",
		duration: t.target_duration_seconds !== null ? formatDuration(t.target_duration_seconds) : "",
		distance: "",
	};
}

/**
 * Converts the text inputs into a set payload, keeping only the fields the tracking type uses.
 * Returns null when the required fields are missing or invalid.
 */
export function setInputFromDraft(draft: SetDraft, tracking: TrackingType, is_warmup = false): WorkoutSetInput | null {

	const n = (v: string) => {
		if (!v.trim()) return null;
		const x = Number(v);
		return Number.isFinite(x) && x >= 0 ? x : NaN;
	};

	const weight = n(draft.weight);
	const reps = n(draft.reps);
	const distance = n(draft.distance);
	const duration = draft.duration.trim() ? parseDuration(draft.duration) ?? NaN : null;

	const invalid = [weight, reps, distance, duration].some((v) => Number.isNaN(v));
	if (invalid) return null;
	if (reps !== null && !Number.isInteger(reps)) return null;

	switch (tracking) {
		case "WEIGHT_REPS":
			if (reps === null) return null;
			return { weight, reps, is_warmup };
		case "REPS":
			if (reps === null) return null;
			return { reps, weight, is_warmup };
		case "TIME":
			if (duration === null) return null;
			return { duration_seconds: duration, is_warmup };
		case "DISTANCE_TIME":
			if (distance === null && duration === null) return null;
			return { distance, duration_seconds: duration, is_warmup };
	}

}
/**
 * Splits an ordered exercise list into blocks: a superset (2+ exercises linked
 * with superset_with_next) or a single standalone exercise.
 */
export function groupSupersets<T extends { superset_with_next: boolean }>(items: T[]): T[][] {

	const groups: T[][] = [];
	let current: T[] = [];

	for (const item of items) {
		current.push(item);
		if (!item.superset_with_next) {
			groups.push(current);
			current = [];
		}
	}

	if (current.length) groups.push(current);

	return groups;

}