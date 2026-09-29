import "server-only";
import pool from "@/lib/db/db";
import { ResponseBuilder as R } from "@/lib/utils/response";
import { CalendarWorkout, ScheduledWorkout, WorkoutCalendar } from "@/lib/dataTypes";

/**
 * Planned workouts plus unplanned finished workouts between two dates (inclusive).
 * Dates and "today" are in the user's timezone.
 */
export async function getWorkoutCalendar(user_id: string, from: string, to: string): Promise<WorkoutCalendar> {

	const todaySql = `SELECT to_char((now() AT TIME ZONE timezone)::date, 'YYYY-MM-DD') AS today FROM users WHERE id = $1`;

	const scheduledSql = `
		SELECT
			ws.id::int,
			to_char(ws.scheduled_date, 'YYYY-MM-DD') AS date,
			ws.template_id::int,
			t.name AS template_name,
			ws.session_id::int,
			CASE
				WHEN s.id IS NOT NULL AND s.ended_at IS NOT NULL THEN 'completed'
				WHEN s.id IS NOT NULL THEN 'in_progress'
				WHEN ws.scheduled_date < (now() AT TIME ZONE u.timezone)::date THEN 'missed'
				ELSE 'planned'
			END AS status
		FROM workout_schedule ws
		JOIN users u ON u.id = ws.user_id
		JOIN workout_templates t ON t.id = ws.template_id
		LEFT JOIN workout_sessions s ON s.id = ws.session_id
		WHERE ws.user_id = $1 AND ws.scheduled_date BETWEEN $2::date AND $3::date
		ORDER BY ws.scheduled_date, ws.id
	`;

	const sessionsSql = `
		SELECT
			s.id::int,
			s.name,
			to_char((s.started_at AT TIME ZONE u.timezone)::date, 'YYYY-MM-DD') AS date,
			(SELECT COUNT(*)::int
			 FROM workout_session_exercises se
			 JOIN workout_sets st ON st.session_exercise_id = se.id
			 WHERE se.session_id = s.id) AS set_count
		FROM workout_sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.user_id = $1
			AND s.ended_at IS NOT NULL
			AND (s.started_at AT TIME ZONE u.timezone)::date BETWEEN $2::date AND $3::date
			AND NOT EXISTS (SELECT 1 FROM workout_schedule ws WHERE ws.session_id = s.id)
		ORDER BY s.started_at
	`;

	const [today, scheduled, sessions] = await Promise.all([
		pool.query<{ today: string }>(todaySql, [user_id]),
		pool.query<ScheduledWorkout>(scheduledSql, [user_id, from, to]),
		pool.query<CalendarWorkout>(sessionsSql, [user_id, from, to]),
	]);

	return {
		today: today.rows[0]?.today,
		scheduled: scheduled.rows,
		sessions: sessions.rows,
	};

}

/**
 * Plans a template on a date.
 */
export async function scheduleWorkout(user_id: string, template_id: number, date: string) {

	const { rows } = await pool.query<{ id: number }>(
		`INSERT INTO workout_schedule (user_id, template_id, scheduled_date)
		 SELECT $1, t.id, $3::date
		 FROM workout_templates t
		 WHERE t.id = $2 AND t.user_id = $1
		 RETURNING id::int`,
		[user_id, template_id, date]
	);

	if (!rows[0]) throw R.notFound("Template not found");

	return rows[0].id;

}

/**
 * Removes a planned workout. A workout already started from it is kept.
 */
export async function unscheduleWorkout(user_id: string, id: number) {

	const { rowCount } = await pool.query(
		`DELETE FROM workout_schedule WHERE id = $1 AND user_id = $2`,
		[id, user_id]
	);

	if (!rowCount) throw R.notFound("Planned workout not found");

}