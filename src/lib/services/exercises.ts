import "server-only";
import pool from "@/lib/db/db";
import { Exercise, ExerciseCreate } from "@/lib/dataTypes";

const EXERCISE_COLUMNS = `
	id::int,
	user_id,
	name,
	muscle_group,
	equipment,
	tracking_type,
	is_verified,
	(user_id IS NOT NULL) AS is_custom,
	created_at
`;

/**
 * Searches the global exercise catalog plus the user's own custom exercises.
 * Prefix matches rank above substring matches.
 */
export async function findExercises(user_id: string, text: string, muscle_group?: string) {

	const sql = `
		SELECT ${EXERCISE_COLUMNS}
		FROM exercises
		WHERE
			(user_id IS NULL OR user_id = $1)
			AND name ILIKE '%' || $2 || '%'
			AND ($3::text IS NULL OR muscle_group = $3)
		ORDER BY
			(name ILIKE $2 || '%') DESC,
			name
		LIMIT 25;
	`;

	const { rows } = await pool.query<Exercise>(sql, [user_id, text, muscle_group ?? null]);
	return rows;

}

/**
 * Creates an exercise. Admins create verified global exercises; everyone else
 * creates a custom exercise visible only to them.
 * Returns null if an exercise with the same name already exists in that scope.
 */
export async function createExercise(user_id: string, data: ExerciseCreate, is_sys_admin = false) {

	const sql = `
		INSERT INTO exercises (user_id, name, muscle_group, equipment, tracking_type, is_verified)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING ${EXERCISE_COLUMNS};
	`;

	try {
		const { rows } = await pool.query<Exercise>(sql, [
			is_sys_admin ? null : user_id,
			data.name,
			data.muscle_group,
			data.equipment,
			data.tracking_type,
			is_sys_admin,
		]);
		return rows[0];
	} catch (err: any) {
		if (err?.code === "23505") return null;
		throw err;
	}

}

/**
 * Deletes one of the user's custom exercises. Global exercises can't be deleted here.
 * Returns "in_use" if the exercise has been logged in a workout (history keeps it).
 */
export async function deleteExercise(user_id: string, id: number): Promise<"deleted" | "not_found" | "in_use"> {

	try {
		const { rowCount } = await pool.query(
			`DELETE FROM exercises WHERE id = $1 AND user_id = $2`,
			[id, user_id]
		);
		return rowCount ? "deleted" : "not_found";
	} catch (err: any) {
		if (err?.code === "23503") return "in_use";
		throw err;
	}

}