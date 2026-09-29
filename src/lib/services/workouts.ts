import "server-only";
import pool from "@/lib/db/db";
import type { PoolClient } from "pg";
import { ResponseBuilder as R } from "@/lib/utils/response";
import {
	ExerciseHistory,
	WorkoutSession,
	WorkoutSessionSummary,
	WorkoutSetInput,
} from "@/lib/dataTypes";

type Queryable = Pick<PoolClient, "query">;

/**
 * Builds the query for a full session (exercises + sets as nested JSON).
 * $1 is always the user id; `where` adds conditions on the `s` alias.
 */
function sessionDetailSQL(where: string, suffix = "") {
	return `
		SELECT
			s.id::int,
			s.template_id::int,
			s.name,
			s.notes,
			s.started_at,
			s.ended_at,
			COALESCE((
				SELECT json_agg(
					json_build_object(
						'id',                       se.id,
						'exercise_id',              se.exercise_id,
						'exercise_name',            e.name,
						'muscle_group',             e.muscle_group,
						'equipment',                e.equipment,
						'tracking_type',            e.tracking_type,
						'position',                 se.position,
						'target_sets',              se.target_sets,
						'target_reps',              se.target_reps,
						'target_weight',            se.target_weight,
						'target_duration_seconds',  se.target_duration_seconds,
						'sets', COALESCE((
							SELECT json_agg(
								json_build_object(
									'id',                   ws.id,
									'session_exercise_id',  ws.session_exercise_id,
									'set_number',           ws.set_number,
									'weight',               ws.weight,
									'reps',                 ws.reps,
									'duration_seconds',     ws.duration_seconds,
									'distance',             ws.distance,
									'is_warmup',            ws.is_warmup,
									'created_at',           ws.created_at
								) ORDER BY ws.set_number
							)
							FROM workout_sets ws
							WHERE ws.session_exercise_id = se.id
						), '[]'::json)
					) ORDER BY se.position
				)
				FROM workout_session_exercises se
				JOIN exercises e ON e.id = se.exercise_id
				WHERE se.session_id = s.id
			), '[]'::json) AS exercises
		FROM workout_sessions s
		WHERE s.user_id = $1 AND ${where}
		${suffix}
	`;
}

async function getSessionById(db: Queryable, user_id: string, session_id: number) {
	const { rows } = await db.query<WorkoutSession>(sessionDetailSQL("s.id = $2"), [user_id, session_id]);
	return rows[0] ?? null;
}

/**
 * Returns the session, throwing a 404 response if it isn't the user's.
 */
export async function getWorkoutSession(user_id: string, session_id: number) {
	const session = await getSessionById(pool, user_id, session_id);
	if (!session) throw R.notFound("Workout not found");
	return session;
}

/**
 * The user's in-progress workout, or null.
 */
export async function getActiveWorkoutSession(user_id: string) {
	const { rows } = await pool.query<WorkoutSession>(sessionDetailSQL("s.ended_at IS NULL"), [user_id]);
	return rows[0] ?? null;
}

/**
 * Finished workouts started in the trailing window of days, newest first, with all sets.
 */
export async function getWorkoutSessionsForDays(user_id: string, days: number) {
	const { rows } = await pool.query<WorkoutSession>(
		sessionDetailSQL(
			"s.ended_at IS NOT NULL AND s.started_at >= now() - ($2 || ' days')::interval",
			"ORDER BY s.started_at DESC"
		),
		[user_id, days]
	);
	return rows;
}

/**
 * Finished workouts for the history list, newest first.
 */
export async function listWorkoutSessions(user_id: string, limit = 20, offset = 0) {

	const sql = `
		SELECT
			s.id::int,
			s.template_id::int,
			s.name,
			s.started_at,
			s.ended_at,
			COUNT(DISTINCT se.id)::int AS exercise_count,
			COUNT(ws.id)::int AS set_count,
			COALESCE(SUM(ws.weight * ws.reps) FILTER (WHERE NOT ws.is_warmup), 0)::float AS volume,
			COALESCE(
				(SELECT array_agg(e.name ORDER BY se2.position)
				 FROM workout_session_exercises se2
				 JOIN exercises e ON e.id = se2.exercise_id
				 WHERE se2.session_id = s.id),
				'{}'
			) AS exercise_names
		FROM workout_sessions s
		LEFT JOIN workout_session_exercises se ON se.session_id = s.id
		LEFT JOIN workout_sets ws ON ws.session_exercise_id = se.id
		WHERE s.user_id = $1 AND s.ended_at IS NOT NULL
		GROUP BY s.id
		ORDER BY s.started_at DESC
		LIMIT $2 OFFSET $3
	`;

	const { rows } = await pool.query<WorkoutSessionSummary>(sql, [user_id, limit, offset]);
	return rows;

}

/**
 * Throws a 400 unless every exercise id is a global exercise or one of the user's own.
 */
export async function assertExercisesVisible(db: Queryable, user_id: string, exercise_ids: number[]) {

	const unique = [...new Set(exercise_ids)];
	if (unique.length === 0) return;

	const { rows } = await db.query<{ count: number }>(
		`SELECT COUNT(*)::int AS count FROM exercises WHERE id = ANY($1::bigint[]) AND (user_id IS NULL OR user_id = $2)`,
		[unique, user_id]
	);

	if (rows[0].count !== unique.length) throw R.badRequest("Unknown exercise");

}

/**
 * Starts a workout, optionally pre-filled from a template or from a planned calendar entry
 * (which supplies the template and gets linked to the new workout).
 * Only one workout can be in progress at a time.
 */
export async function startWorkoutSession(
	user_id: string,
	data: { template_id?: number | null; schedule_id?: number | null; name?: string | null }
) {

	const client = await pool.connect();

	try {

		await client.query("BEGIN");

		let name = data.name?.trim() || "Workout";

		if (data.schedule_id) {
			const { rows } = await client.query<{ template_id: number; session_id: number | null }>(
				`SELECT template_id::int, session_id::int FROM workout_schedule WHERE id = $1 AND user_id = $2 FOR UPDATE`,
				[data.schedule_id, user_id]
			);
			if (!rows[0]) throw R.notFound("Planned workout not found");
			if (rows[0].session_id) throw R.badRequest("This planned workout was already started");
			data = { ...data, template_id: rows[0].template_id };
		}

		if (data.template_id) {
			const { rows } = await client.query<{ name: string }>(
				`SELECT name FROM workout_templates WHERE id = $1 AND user_id = $2`,
				[data.template_id, user_id]
			);
			if (!rows[0]) throw R.notFound("Template not found");
			name = data.name?.trim() || rows[0].name;
		}

		let session_id: number;

		try {
			const { rows } = await client.query<{ id: number }>(
				`INSERT INTO workout_sessions (user_id, template_id, name) VALUES ($1, $2, $3) RETURNING id::int`,
				[user_id, data.template_id ?? null, name]
			);
			session_id = rows[0].id;
		} catch (err: any) {
			if (err?.code === "23505") throw R.badRequest("You already have a workout in progress");
			throw err;
		}

		if (data.schedule_id) {
			await client.query(`UPDATE workout_schedule SET session_id = $1 WHERE id = $2`, [session_id, data.schedule_id]);
		}

		if (data.template_id) {
			await client.query(
				`INSERT INTO workout_session_exercises
					(session_id, exercise_id, position, target_sets, target_reps, target_weight, target_duration_seconds)
				 SELECT $1, exercise_id, position, target_sets, target_reps, target_weight, target_duration_seconds
				 FROM workout_template_exercises
				 WHERE template_id = $2`,
				[session_id, data.template_id]
			);
		}

		const session = await getSessionById(client, user_id, session_id);

		await client.query("COMMIT");

		return session!;

	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}

}

/**
 * Renames / annotates a workout, and optionally finishes it.
 */
export async function updateWorkoutSession(
	user_id: string,
	session_id: number,
	data: { name?: string; notes?: string | null; finish?: boolean }
) {

	const { rowCount } = await pool.query(
		`UPDATE workout_sessions
		 SET
			name     = COALESCE($3, name),
			notes    = CASE WHEN $4::boolean THEN $5 ELSE notes END,
			ended_at = CASE WHEN $6::boolean AND ended_at IS NULL THEN now() ELSE ended_at END
		 WHERE id = $1 AND user_id = $2`,
		[session_id, user_id, data.name?.trim() || null, data.notes !== undefined, data.notes ?? null, !!data.finish]
	);

	if (!rowCount) throw R.notFound("Workout not found");

	return getWorkoutSession(user_id, session_id);

}

export async function deleteWorkoutSession(user_id: string, session_id: number) {

	const { rowCount } = await pool.query(
		`DELETE FROM workout_sessions WHERE id = $1 AND user_id = $2`,
		[session_id, user_id]
	);

	if (!rowCount) throw R.notFound("Workout not found");

}

/**
 * Appends an exercise to the end of a workout.
 */
export async function addWorkoutSessionExercise(user_id: string, session_id: number, exercise_id: number) {

	const owns = await pool.query(`SELECT 1 FROM workout_sessions WHERE id = $1 AND user_id = $2`, [session_id, user_id]);
	if (!owns.rowCount) throw R.notFound("Workout not found");

	await assertExercisesVisible(pool, user_id, [exercise_id]);

	await pool.query(
		`INSERT INTO workout_session_exercises (session_id, exercise_id, position)
		 SELECT $1, $2, COALESCE(MAX(position), -1) + 1
		 FROM workout_session_exercises
		 WHERE session_id = $1`,
		[session_id, exercise_id]
	);

	return getWorkoutSession(user_id, session_id);

}

/**
 * Removes an exercise (and its sets) from a workout.
 */
export async function removeWorkoutSessionExercise(user_id: string, session_exercise_id: number) {

	const { rows } = await pool.query<{ session_id: number }>(
		`DELETE FROM workout_session_exercises se
		 USING workout_sessions s
		 WHERE se.id = $1 AND s.id = se.session_id AND s.user_id = $2
		 RETURNING se.session_id::int`,
		[session_exercise_id, user_id]
	);

	if (!rows[0]) throw R.notFound("Exercise not found in workout");

	return getWorkoutSession(user_id, rows[0].session_id);

}

/**
 * Validates a set body. Every field is optional but at least one measurement is required.
 */
export function parseSetInput(body: any): WorkoutSetInput {

	const out: WorkoutSetInput = {};

	const fields = ["weight", "reps", "duration_seconds", "distance"] as const;
	const integers = new Set(["reps", "duration_seconds"]);

	for (const f of fields) {

		const v = body?.[f];

		if (v === undefined || v === null || v === "") {
			out[f] = null;
			continue;
		}

		const n = Number(v);

		if (!Number.isFinite(n) || n < 0) throw R.badRequest(`${f} must be a non-negative number`);
		if (integers.has(f) && !Number.isInteger(n)) throw R.badRequest(`${f} must be a whole number`);

		out[f] = n;

	}

	if (fields.every((f) => out[f] === null)) throw R.badRequest("A set needs at least one value");

	out.is_warmup = body?.is_warmup === true;

	return out;

}

// resolves the owning session for a session exercise, or throws 404
async function sessionIdForSessionExercise(user_id: string, session_exercise_id: number) {

	const { rows } = await pool.query<{ session_id: number }>(
		`SELECT se.session_id::int
		 FROM workout_session_exercises se
		 JOIN workout_sessions s ON s.id = se.session_id
		 WHERE se.id = $1 AND s.user_id = $2`,
		[session_exercise_id, user_id]
	);

	if (!rows[0]) throw R.notFound("Exercise not found in workout");

	return rows[0].session_id;

}

/**
 * Logs the next set for an exercise in a workout.
 */
export async function addWorkoutSet(user_id: string, session_exercise_id: number, input: WorkoutSetInput) {

	const session_id = await sessionIdForSessionExercise(user_id, session_exercise_id);

	await pool.query(
		`INSERT INTO workout_sets (session_exercise_id, set_number, weight, reps, duration_seconds, distance, is_warmup)
		 SELECT $1, COALESCE(MAX(set_number), 0) + 1, $2, $3, $4, $5, $6
		 FROM workout_sets
		 WHERE session_exercise_id = $1`,
		[session_exercise_id, input.weight, input.reps, input.duration_seconds, input.distance, input.is_warmup]
	);

	return getWorkoutSession(user_id, session_id);

}

export async function updateWorkoutSet(user_id: string, set_id: number, input: WorkoutSetInput) {

	const { rows } = await pool.query<{ session_id: number }>(
		`UPDATE workout_sets ws
		 SET weight = $3, reps = $4, duration_seconds = $5, distance = $6, is_warmup = $7
		 FROM workout_session_exercises se
		 JOIN workout_sessions s ON s.id = se.session_id
		 WHERE ws.id = $1 AND se.id = ws.session_exercise_id AND s.user_id = $2
		 RETURNING se.session_id::int`,
		[set_id, user_id, input.weight, input.reps, input.duration_seconds, input.distance, input.is_warmup]
	);

	if (!rows[0]) throw R.notFound("Set not found");

	return getWorkoutSession(user_id, rows[0].session_id);

}

/**
 * Deletes a set and renumbers the remaining sets for that exercise.
 */
export async function deleteWorkoutSet(user_id: string, set_id: number) {

	const client = await pool.connect();

	try {

		await client.query("BEGIN");

		const { rows } = await client.query<{ session_id: number; session_exercise_id: number }>(
			`DELETE FROM workout_sets ws
			 USING workout_session_exercises se, workout_sessions s
			 WHERE ws.id = $1 AND se.id = ws.session_exercise_id AND s.id = se.session_id AND s.user_id = $2
			 RETURNING se.session_id::int, ws.session_exercise_id::int`,
			[set_id, user_id]
		);

		if (!rows[0]) throw R.notFound("Set not found");

		await client.query(
			`UPDATE workout_sets ws
			 SET set_number = r.rn
			 FROM (
				SELECT id, ROW_NUMBER() OVER (ORDER BY set_number) AS rn
				FROM workout_sets
				WHERE session_exercise_id = $1
			 ) r
			 WHERE ws.id = r.id`,
			[rows[0].session_exercise_id]
		);

		const session = await getSessionById(client, user_id, rows[0].session_id);

		await client.query("COMMIT");

		return session!;

	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}

}

/**
 * Last finished performance plus per-workout progression for one exercise.
 * Estimated 1RM uses the Epley formula on working sets of 1–12 reps.
 */
export async function getExerciseHistory(user_id: string, exercise_id: number): Promise<ExerciseHistory> {

	const lastSql = `
		SELECT
			s.id::int AS session_id,
			s.started_at,
			json_agg(
				json_build_object(
					'id',                   ws.id,
					'session_exercise_id',  ws.session_exercise_id,
					'set_number',           ws.set_number,
					'weight',               ws.weight,
					'reps',                 ws.reps,
					'duration_seconds',     ws.duration_seconds,
					'distance',             ws.distance,
					'is_warmup',            ws.is_warmup,
					'created_at',           ws.created_at
				) ORDER BY se.position, ws.set_number
			) AS sets
		FROM workout_sessions s
		JOIN workout_session_exercises se ON se.session_id = s.id
		JOIN workout_sets ws ON ws.session_exercise_id = se.id
		WHERE s.user_id = $1 AND se.exercise_id = $2 AND s.ended_at IS NOT NULL
		GROUP BY s.id
		ORDER BY s.started_at DESC
		LIMIT 1
	`;

	const progressSql = `
		SELECT * FROM (
			SELECT
				to_char((s.started_at AT TIME ZONE u.timezone)::date, 'YYYY-MM-DD') AS date,
				s.started_at,
				MAX(ws.weight) FILTER (WHERE NOT ws.is_warmup)::float AS top_weight,
				MAX(
					CASE WHEN ws.reps = 1 THEN ws.weight ELSE ws.weight * (1 + ws.reps / 30.0) END
				) FILTER (WHERE NOT ws.is_warmup AND ws.weight > 0 AND ws.reps BETWEEN 1 AND 12)::float AS est_1rm,
				COALESCE(SUM(ws.weight * ws.reps) FILTER (WHERE NOT ws.is_warmup), 0)::float AS volume,
				COALESCE(SUM(ws.reps) FILTER (WHERE NOT ws.is_warmup), 0)::int AS total_reps,
				COALESCE(SUM(ws.duration_seconds) FILTER (WHERE NOT ws.is_warmup), 0)::int AS total_duration_seconds,
				COALESCE(SUM(ws.distance) FILTER (WHERE NOT ws.is_warmup), 0)::float AS total_distance
			FROM workout_sessions s
			JOIN users u ON u.id = s.user_id
			JOIN workout_session_exercises se ON se.session_id = s.id
			JOIN workout_sets ws ON ws.session_exercise_id = se.id
			WHERE s.user_id = $1 AND se.exercise_id = $2 AND s.ended_at IS NOT NULL
			GROUP BY s.id, u.timezone
			ORDER BY s.started_at DESC
			LIMIT 100
		) recent
		ORDER BY started_at ASC
	`;

	const [last, progress] = await Promise.all([
		pool.query(lastSql, [user_id, exercise_id]),
		pool.query(progressSql, [user_id, exercise_id]),
	]);

	return {
		last: last.rows[0] ?? null,
		progress: progress.rows.map(({ started_at: _, ...p }) => p),
	};

}