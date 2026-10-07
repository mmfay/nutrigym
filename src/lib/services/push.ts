import "server-only";
import webpush from "web-push";
import pool from "@/lib/db/db";
import { ResponseBuilder as R } from "@/lib/utils/response";
import { PushPayload, PushSubscriptionInput, ReminderKind, ReminderPreferences } from "@/lib/dataTypes";
import { getTodaysOpenScheduledWorkouts } from "./workout_schedule";

// a reminder still goes out this many minutes after its time (covers restarts); later than that it's skipped for the day
const REMINDER_WINDOW_MINUTES = 120;

const REMINDER_KINDS: ReminderKind[] = ["workout", "breakfast", "lunch", "dinner"];

const DEFAULT_PREFERENCES: ReminderPreferences = {
	workout_time: 8 * 60,
	breakfast_time: null,
	lunch_time: null,
	dinner_time: null,
};

type StoredSubscription = { id: number; endpoint: string; p256dh: string; auth: string };

let vapidReady: boolean | null = null;

/**
 * Configures web-push from VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT.
 * Returns false when push isn't set up on this server.
 */
export function isPushConfigured() {

	if (vapidReady !== null) return vapidReady;

	const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;

	if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
		vapidReady = false;
		return vapidReady;
	}

	webpush.setVapidDetails(VAPID_SUBJECT || "mailto:support@softwarerror.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
	vapidReady = true;
	return vapidReady;

}

export function getPushPublicKey() {
	return isPushConfigured() ? process.env.VAPID_PUBLIC_KEY! : null;
}

/**
 * Validates a PushSubscription.toJSON() body, throwing a 400 response on bad input.
 */
export function parseSubscriptionInput(body: any): PushSubscriptionInput {

	const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
	const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh : "";
	const auth = typeof body?.keys?.auth === "string" ? body.keys.auth : "";

	if (!endpoint.startsWith("https://") || endpoint.length > 2048) throw R.badRequest("Invalid push endpoint");
	if (!p256dh || !auth || p256dh.length > 256 || auth.length > 256) throw R.badRequest("Invalid push keys");

	return { endpoint, keys: { p256dh, auth } };

}

/**
 * Saves a device's subscription. A device that signs in to another account moves to that account.
 */
export async function savePushSubscription(user_id: string, sub: PushSubscriptionInput) {

	// a device moving to another account starts fresh, so that account still gets today's reminders
	await pool.query(
		`DELETE FROM push_reminders_sent
		 WHERE subscription_id IN (SELECT id FROM push_subscriptions WHERE endpoint = $1 AND user_id <> $2)`,
		[sub.endpoint, user_id]
	);

	await pool.query(
		`INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (endpoint) DO UPDATE
		 SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
		[user_id, sub.endpoint, sub.keys.p256dh, sub.keys.auth]
	);

}

export async function getReminderPreferences(user_id: string): Promise<ReminderPreferences> {

	const { rows } = await pool.query<ReminderPreferences>(
		`SELECT workout_time, breakfast_time, lunch_time, dinner_time FROM reminder_preferences WHERE user_id = $1`,
		[user_id]
	);

	return rows[0] ?? DEFAULT_PREFERENCES;

}

/**
 * Validates a preferences body: each time is null (off) or minutes after midnight in 15-minute steps.
 */
export function parseReminderPreferences(body: any): ReminderPreferences {

	const out = { ...DEFAULT_PREFERENCES };

	for (const kind of REMINDER_KINDS) {

		const key = `${kind}_time` as const;
		const v = body?.[key];

		if (v === null) {
			out[key] = null;
			continue;
		}

		if (!Number.isInteger(v) || v < 0 || v > 1439 || v % 15 !== 0) throw R.badRequest(`Invalid ${kind} reminder time`);

		out[key] = v;

	}

	return out;

}

export async function saveReminderPreferences(user_id: string, prefs: ReminderPreferences) {

	await pool.query(
		`INSERT INTO reminder_preferences (user_id, workout_time, breakfast_time, lunch_time, dinner_time)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (user_id) DO UPDATE
		 SET workout_time = EXCLUDED.workout_time, breakfast_time = EXCLUDED.breakfast_time,
			lunch_time = EXCLUDED.lunch_time, dinner_time = EXCLUDED.dinner_time, updated_at = now()`,
		[user_id, prefs.workout_time, prefs.breakfast_time, prefs.lunch_time, prefs.dinner_time]
	);

	return prefs;

}

export async function deletePushSubscription(user_id: string, endpoint: string) {
	await pool.query(`DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`, [user_id, endpoint]);
}

/**
 * Sends one push. Subscriptions the push service reports as gone are deleted.
 */
async function sendPush(sub: StoredSubscription, payload: PushPayload) {

	try {

		await webpush.sendNotification(
			{ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
			JSON.stringify(payload),
			{ TTL: 12 * 60 * 60 }
		);

		return true;

	} catch (err: any) {

		if (err?.statusCode === 404 || err?.statusCode === 410) {
			await pool.query(`DELETE FROM push_subscriptions WHERE id = $1`, [sub.id]);
		} else {
			console.error("Push failed:", err?.statusCode ?? "", err?.body ?? err);
		}

		return false;

	}

}

type Macros = { calories: number; protein: number; carbs: number; fat: number };

// one claimed reminder, with what it needs to say
type DueReminder = StoredSubscription & {
	kind: ReminderKind;
	workout_names: string[];
	pending_workouts: number;
	logged: Macros;
	goal: Macros | null;
};

const MEAL_LABELS: Record<Exclude<ReminderKind, "workout">, string> = {
	breakfast: "Breakfast",
	lunch: "Lunch",
	dinner: "Dinner",
};

// "Protein 61% · 62g left" / "Fat 112% · 7g over"
function macroLine(label: string, logged: number, goal: number, unit: string) {

	if (!goal) return null;

	const pct = Math.round((logged / goal) * 100);
	const diff = Math.round(goal - logged);

	return `${label} ${pct}% · ${Math.abs(diff).toLocaleString()}${unit} ${diff >= 0 ? "left" : "over"}`;

}

function reminderPayload(r: DueReminder): PushPayload {

	if (r.kind === "workout") {
		const names = r.workout_names;
		return {
			title: names.length === 1 ? "Workout planned today" : `${names.length} workouts planned today`,
			body: names.length === 1 ? `${names[0]} is on today's plan.` : names.join(", "),
			url: "/training",
			tag: "workout-reminder",
			badge: r.pending_workouts,
		};
	}

	const g = r.goal!;
	const lines = [
		macroLine("Calories", r.logged.calories, g.calories, ""),
		macroLine("Protein", r.logged.protein, g.protein, "g"),
		macroLine("Carbs", r.logged.carbs, g.carbs, "g"),
		macroLine("Fat", r.logged.fat, g.fat, "g"),
	].filter(Boolean);

	return {
		title: `${MEAL_LABELS[r.kind]} check-in`,
		body: lines.join("\n"),
		url: "/tracking",
		tag: "meal-reminder",
	};

}

/**
 * Pushes every reminder that's due: within REMINDER_WINDOW_MINUTES after the user's chosen time
 * (in their timezone), at most once per device per kind per day. Workout reminders need an
 * unfinished planned workout today; meal check-ins need macro goals.
 * Devices are claimed atomically, so overlapping runs never double-send.
 */
export async function sendDueReminders() {

	if (!isPushConfigured()) return 0;

	await pool.query(`DELETE FROM push_reminders_sent WHERE sent_on < current_date - 2`);

	const { rows } = await pool.query<DueReminder>(
		`WITH local AS (
			SELECT
				u.id AS user_id,
				(now() AT TIME ZONE u.timezone)::date AS today,
				(EXTRACT(HOUR FROM now() AT TIME ZONE u.timezone) * 60 + EXTRACT(MINUTE FROM now() AT TIME ZONE u.timezone))::int AS now_min,
				CASE WHEN rp.user_id IS NULL THEN $1::int ELSE rp.workout_time END AS workout_time,
				rp.breakfast_time, rp.lunch_time, rp.dinner_time
			FROM users u
			LEFT JOIN reminder_preferences rp ON rp.user_id = u.id
			WHERE EXISTS (SELECT 1 FROM push_subscriptions p WHERE p.user_id = u.id)
		 ),
		 due AS (
			SELECT l.user_id, l.today, k.kind, w.names AS workout_names, tot.logged, g.goal
			FROM local l
			CROSS JOIN LATERAL (VALUES
				('workout', l.workout_time), ('breakfast', l.breakfast_time), ('lunch', l.lunch_time), ('dinner', l.dinner_time)
			) k(kind, at_min)
			CROSS JOIN LATERAL (
				SELECT COALESCE(array_agg(t.name ORDER BY ws.id), '{}') AS names
				FROM workout_schedule ws
				JOIN workout_templates t ON t.id = ws.template_id
				LEFT JOIN workout_sessions s ON s.id = ws.session_id
				WHERE ws.user_id = l.user_id AND ws.scheduled_date = l.today AND s.ended_at IS NULL
			) w
			CROSS JOIN LATERAL (
				SELECT json_build_object(
					'calories', COALESCE(SUM(ft.calories), 0)::float,
					'protein',  COALESCE(SUM(ft.protein), 0)::float,
					'carbs',    COALESCE(SUM(ft.carbs), 0)::float,
					'fat',      COALESCE(SUM(ft.fat), 0)::float
				) AS logged
				FROM food_tracker ft
				WHERE ft.user_id = l.user_id AND ft.recorded_at = l.today
			) tot
			LEFT JOIN LATERAL (
				SELECT json_build_object(
					'calories', mg.calories::float, 'protein', mg.protein::float, 'carbs', mg.carbs::float, 'fat', mg.fat::float
				) AS goal
				FROM macro_goals mg
				WHERE mg.user_id = l.user_id AND mg.date_to IS NULL
				ORDER BY mg.date_from DESC
				LIMIT 1
			) g ON true
			WHERE k.at_min IS NOT NULL
				AND l.now_min >= k.at_min AND l.now_min < k.at_min + $2
				AND CASE WHEN k.kind = 'workout' THEN cardinality(w.names) > 0 ELSE g.goal IS NOT NULL END
		 ),
		 claimed AS (
			INSERT INTO push_reminders_sent (subscription_id, kind, sent_on)
			SELECT ps.id, due.kind, due.today
			FROM due
			JOIN push_subscriptions ps ON ps.user_id = due.user_id
			ON CONFLICT DO NOTHING
			RETURNING subscription_id, kind
		 )
		 SELECT
			ps.id::int, ps.endpoint, ps.p256dh, ps.auth,
			due.kind, due.workout_names, cardinality(due.workout_names) AS pending_workouts, due.logged, due.goal
		 FROM claimed c
		 JOIN push_subscriptions ps ON ps.id = c.subscription_id
		 JOIN due ON due.user_id = ps.user_id AND due.kind = c.kind`,
		[DEFAULT_PREFERENCES.workout_time, REMINDER_WINDOW_MINUTES]
	);

	const results = await Promise.all(rows.map((r) => sendPush(r, reminderPayload(r))));

	return results.filter(Boolean).length;

}

/**
 * Sends a test push to all of the user's devices, carrying today's real badge count.
 */
export async function sendTestPush(user_id: string) {

	if (!isPushConfigured()) throw R.badRequest("Push notifications aren't set up on this server");

	const [subs, pending] = await Promise.all([
		pool.query<StoredSubscription>(`SELECT id::int, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`, [user_id]),
		getTodaysOpenScheduledWorkouts(user_id),
	]);

	if (!subs.rows.length) throw R.badRequest("No devices have reminders turned on");

	const payload: PushPayload = {
		title: "Reminders are on",
		body: pending.length
			? `${pending.map((w) => w.template_name).join(", ")} still planned for today.`
			: "You'll get reminders at the times you've set.",
		url: "/training",
		tag: "workout-reminder",
		badge: pending.length,
	};

	const results = await Promise.all(subs.rows.map((sub) => sendPush(sub, payload)));

	return results.filter(Boolean).length;

}