// lib/services/food.ts
import pool from "@/lib/db/db";
import { Food, FoodTracked } from "../dataTypes";
import { ResponseBuilder as R } from "../utils/response";

// allows for user to log food
export async function logFood(userId: string, meal: number, date: Date, food: Food): Promise<FoodTracked> {
	
	const client = await pool.connect();
	
	try {
		await client.query("BEGIN");

		// insert and grab the new tracker id
		const insertSql = `
			INSERT INTO food_tracker (
				user_id, meal, food_id, recorded_at,
				carbs, fat, protein, calories, serving_size, serving_unit
			)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
			RETURNING id;
		`;

		const insertParams = [
			userId, meal, food.id, date,
			food.carbs, food.fat, food.protein, food.calories,
			food.serving_size, food.serving_unit,
		];

		const ins = await client.query<{ id: number }>(insertSql, insertParams);
		if (ins.rowCount !== 1) throw new Error("Insert failed.");
		const newId = ins.rows[0].id;

		// read the row from the view
		const selectSql = `
			SELECT 
				v.id,
				v.meal,
				v.food_name as name,
				v.brand,
				v.recorded_at,
				v.carbs,
				v.fat,
				v.protein,
				v.calories,
				v.serving_size,
				v.serving_unit
			FROM food_log_v v
			WHERE v.user_id = $1 AND v.id = $2
			LIMIT 1;
		`;
		const sel = await client.query<FoodTracked>(selectSql, [userId, newId]);
		if (sel.rowCount !== 1) throw new Error("Insert succeeded but joined row not found.");

		await client.query("COMMIT");
		return sel.rows[0];
	} catch (e) {
		await client.query("ROLLBACK");
		throw e;
	} finally {
		client.release();
	}
}

export async function logAIFood(
	userId: string,
	meal: number,
	date: Date,
	food: Food
): Promise<FoodTracked> {

	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const insertSql = `
			INSERT INTO food_tracker (
				user_id,
				recorded_at,
				meal,
				food_id,
				calories,
				carbs,
				fat,
				protein,
				serving_size,
				serving_unit,
				food_name,
				is_ai
			)
			VALUES (
				$1,
				$2,
				$3,
				NULL,
				$4,
				$5,
				$6,
				$7,
				$8,
				$9,
				$10,
				$11
			)
			RETURNING id;
		`;

		const insertParams = [
			userId,
			date,
			meal,
			food.calories,
			food.carbs,
			food.fat,
			food.protein,
			food.serving_size,
			food.serving_unit,
			food.name,
			true,
		];

		const ins = await client.query<{ id: number }>(insertSql, insertParams);

		if (ins.rowCount !== 1) {
			throw R.serverError("Failed to log AI food");
		}

		const newId = ins.rows[0].id;
		const trackedFood = await getTrackedFood(userId, newId, client);

		await client.query("COMMIT");
		return trackedFood;
	} catch (e) {
		await client.query("ROLLBACK");
		throw e;
	} finally {
		client.release();
	}
}

// allows for user to get log of food
export async function getFoodLog(userId: string, date: string) {

	const sql = `
			SELECT 
				v.id
				,v.meal
				,v.food_name		as name
				,v.brand
				,v.recorded_at
				,v.carbs
				,v.fat
				,v.protein
				,v.calories
				,v.serving_size
				,v.serving_unit
			FROM food_log_v v
			where 
				user_id = $1
				and recorded_at = $2;
	`;

	const params = [userId, date];

	const { rows } = await pool.query<FoodTracked[]>(sql, params);

	return rows;

}

// copies a meal from the previous day into toDate
export async function copyMealFromPrevDay(userId: string, meal: number, toDate: string): Promise<FoodTracked[]> {

	const sql = `
		WITH inserted AS (
			INSERT INTO food_tracker (user_id, meal, food_id, recorded_at, carbs, fat, protein, calories, serving_size, serving_unit, food_name, is_ai)
			SELECT user_id, meal, food_id, $3::date, carbs, fat, protein, calories, serving_size, serving_unit, food_name, is_ai
			FROM food_tracker
			WHERE user_id = $1 AND meal = $2 AND recorded_at = $3::date - interval '1 day'
			RETURNING id
		)
		SELECT
			v.id, v.meal, v.food_name AS name, v.brand, v.recorded_at,
			v.carbs, v.fat, v.protein, v.calories, v.serving_size, v.serving_unit
		FROM food_log_v v
		JOIN inserted i ON i.id = v.id
	`;

	const { rows } = await pool.query<FoodTracked>(sql, [userId, meal, toDate]);
	return rows;

}

// remove food from log
export async function removeFood(userId: string, id: number) {

	const sql = `
    	DELETE FROM food_tracker WHERE user_id = $1 and id = $2
	`;

	const params = [userId, id];

	const result = await pool.query(sql, params);

	return;

}

// updates the meal and quantity of a logged food.
// macros are rescaled from the row's own stored values, so this works for
// catalog foods, AI entries and recipes alike. returns null if not found.
export async function updateTrackedFood(
	userId: string,
	id: number,
	meal: number,
	servingSize: number
): Promise<FoodTracked | null> {

	// right-hand side column references use the pre-update values
	const sql = `
		UPDATE food_tracker
		SET
			meal         = $3,
			calories     = ROUND(calories * $4::numeric / serving_size, 0),
			protein      = ROUND(protein  * $4::numeric / serving_size, 1),
			carbs        = ROUND(carbs    * $4::numeric / serving_size, 1),
			fat          = ROUND(fat      * $4::numeric / serving_size, 1),
			serving_size = $4::numeric
		WHERE
			user_id = $1
			AND id = $2
			AND serving_size > 0
		RETURNING id;
	`;

	const { rowCount } = await pool.query(sql, [userId, id, meal, servingSize]);

	if (rowCount !== 1) return null;

	return getTrackedFood(userId, id);

}

// clears a user's entire food tracking history
export async function clearFoodLog(userId: string) {

	await pool.query(
		`DELETE FROM food_tracker WHERE user_id = $1`,
		[userId]
	);

}

export async function getTrackedFood(
	userId: string,
	id: number,
	clientArg?: { query: typeof pool.query }
): Promise<FoodTracked> {

	const db = clientArg ?? pool;

	const sql = `
		SELECT 
			v.id,
			v.meal,
			v.food_name as name,
			v.brand,
			v.recorded_at,
			v.carbs,
			v.fat,
			v.protein,
			v.calories,
			v.serving_size,
			v.serving_unit
		FROM food_log_v v
		WHERE v.user_id = $1 AND v.id = $2
		LIMIT 1;
	`;

	const result = await db.query<FoodTracked>(sql, [userId, id]);

	if (result.rowCount !== 1) {
		throw R.serverError("Tracked food not found.");
	}

	return result.rows[0];
}