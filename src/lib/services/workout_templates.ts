import "server-only";
import pool from "@/lib/db/db";
import type { PoolClient } from "pg";
import { ResponseBuilder as R } from "@/lib/utils/response";
import { WorkoutTemplate, WorkoutTemplateCreate, WorkoutTemplateExerciseCreate } from "@/lib/dataTypes";
import { assertExercisesVisible } from "./workouts";

export async function getUserWorkoutTemplates(user_id: string) {

	const sql = `
		SELECT
			t.id::int,
			t.name,
			t.notes,
			t.created_at,
			COALESCE(
				json_agg(
					json_build_object(
						'id',                       te.id,
						'exercise_id',              te.exercise_id,
						'exercise_name',            e.name,
						'muscle_group',             e.muscle_group,
						'tracking_type',            e.tracking_type,
						'position',                 te.position,
						'target_sets',              te.target_sets,
						'target_reps',              te.target_reps,
						'target_weight',            te.target_weight,
						'target_duration_seconds',  te.target_duration_seconds
					) ORDER BY te.position
				) FILTER (WHERE te.id IS NOT NULL),
				'[]'
			) AS exercises
		FROM workout_templates t
		LEFT JOIN workout_template_exercises te ON te.template_id = t.id
		LEFT JOIN exercises e ON e.id = te.exercise_id
		WHERE t.user_id = $1
		GROUP BY t.id
		ORDER BY t.updated_at DESC
	`;

	const { rows } = await pool.query<WorkoutTemplate>(sql, [user_id]);
	return rows;

}

/**
 * Validates a template body, throwing a 400 response on bad input.
 */
export function parseTemplateInput(body: any): WorkoutTemplateCreate {

	const name = typeof body?.name === "string" ? body.name.trim() : "";
	if (!name) throw R.badRequest("Template name is required");

	if (!Array.isArray(body?.exercises) || body.exercises.length === 0) {
		throw R.badRequest("Template must have at least one exercise");
	}

	const optionalInt = (v: unknown, label: string) => {
		if (v === undefined || v === null || v === "") return null;
		const n = Number(v);
		if (!Number.isInteger(n) || n < 0) throw R.badRequest(`${label} must be a whole number`);
		return n;
	};

	const exercises: WorkoutTemplateExerciseCreate[] = body.exercises.map((ex: any) => {

		const exercise_id = Number(ex?.exercise_id);
		if (!Number.isInteger(exercise_id) || exercise_id <= 0) throw R.badRequest("Invalid exercise");

		const target_sets = Number(ex?.target_sets);
		if (!Number.isInteger(target_sets) || target_sets < 1 || target_sets > 20) {
			throw R.badRequest("Target sets must be between 1 and 20");
		}

		let target_weight: number | null = null;
		if (ex?.target_weight !== undefined && ex?.target_weight !== null && ex?.target_weight !== "") {
			target_weight = Number(ex.target_weight);
			if (!Number.isFinite(target_weight) || target_weight < 0) throw R.badRequest("Target weight must be a positive number");
		}

		return {
			exercise_id,
			target_sets,
			target_reps: optionalInt(ex?.target_reps, "Target reps"),
			target_weight,
			target_duration_seconds: optionalInt(ex?.target_duration_seconds, "Target duration"),
		};

	});

	const notes = typeof body?.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

	return { name, notes, exercises };

}

async function insertTemplateExercises(client: PoolClient, template_id: number, exercises: WorkoutTemplateExerciseCreate[]) {

	for (const [position, ex] of exercises.entries()) {
		await client.query(
			`INSERT INTO workout_template_exercises
				(template_id, exercise_id, position, target_sets, target_reps, target_weight, target_duration_seconds)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			[template_id, ex.exercise_id, position, ex.target_sets, ex.target_reps ?? null, ex.target_weight ?? null, ex.target_duration_seconds ?? null]
		);
	}

}

/**
 * Creates a template, or replaces an existing one's name, notes and exercises when `template_id` is given.
 */
export async function saveWorkoutTemplate(user_id: string, data: WorkoutTemplateCreate, template_id?: number) {

	const client = await pool.connect();
	let id: number;

	try {

		await client.query("BEGIN");

		await assertExercisesVisible(client, user_id, data.exercises.map((e) => e.exercise_id));

		if (template_id) {

			const { rows } = await client.query<{ id: number }>(
				`UPDATE workout_templates SET name = $3, notes = $4, updated_at = now()
				 WHERE id = $1 AND user_id = $2
				 RETURNING id::int`,
				[template_id, user_id, data.name, data.notes ?? null]
			);

			if (!rows[0]) throw R.notFound("Template not found");

			id = rows[0].id;

			await client.query(`DELETE FROM workout_template_exercises WHERE template_id = $1`, [id]);

		} else {

			const { rows } = await client.query<{ id: number }>(
				`INSERT INTO workout_templates (user_id, name, notes) VALUES ($1, $2, $3) RETURNING id::int`,
				[user_id, data.name, data.notes ?? null]
			);

			id = rows[0].id;

		}

		await insertTemplateExercises(client, id, data.exercises);

		await client.query("COMMIT");

	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}

	const templates = await getUserWorkoutTemplates(user_id);
	return templates.find((t) => t.id === id)!;

}

export async function deleteWorkoutTemplate(user_id: string, template_id: number) {

	const { rowCount } = await pool.query(
		`DELETE FROM workout_templates WHERE id = $1 AND user_id = $2`,
		[template_id, user_id]
	);

	if (!rowCount) throw R.notFound("Template not found");

}