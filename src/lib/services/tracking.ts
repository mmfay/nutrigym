// lib/services/food.ts
import pool from "@/lib/db/db";
import { Food, FoodTracked } from "../dataTypes";

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

// remove food from log
export async function removeFood(userId: string, id: number) {
	
	const sql = `
    	DELETE FROM food_tracker WHERE user_id = $1 and id = $2
	`;

	const params = [userId, id];
	
	const result = await pool.query(sql, params);
	
	return;

}