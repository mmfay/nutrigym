// lib/services/food.ts
import pool from "@/lib/db/db";
import { Food, FoodTracked } from "../dataTypes";
import { ResponseBuilder as R } from "@/lib/utils/response";

// allows for user to log food
export async function logFood(userId: string, meal: number, date: Date, food: Food) {
	
	const sql = `
    	INSERT INTO food_tracker (
      		user_id,
      		meal,
			food_id,
			recorded_at,
			carbs,
			fat,
			protein,
			calories,
			serving_size,
			serving_unit
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		RETURNING id, user_id, meal, food_id, recorded_at;
	`;

	const params = [userId, meal, food.id, date, food.carbs, food.fat, food.protein, food.calories, food.serving_size, food.serving_unit];
	
	const result = await pool.query(sql, params);

	// DB-level validation
	if (result.rowCount !== 1) {
		throw new Error("Insert failed: no row inserted.");
	}

	const row = result.rows[0];

	if (!row?.id) {
		throw new Error("Insert failed: missing returned id.");
	}
	
	return row;

}

// allows for user to get log of food
export async function getFoodLog(userId: string, date: string) {

	const sql = `
			SELECT 
				v.entry_id			as id
				,v.meal
				,v.food_name		as name
				,v.brand
				,v.recorded_at
				,v.carbs_logged		as carbs
				,v.fat_logged		as fat
				,v.protein_logged	as protein
				,v.calories_logged	as calories
				,v.logged_serving_size
				,v.logged_serving_unit
			FROM v_food_log v  
			where 
				user_id = $1
				and recorded_at = $2;
	`;

	const params = [userId, date];

	const { rows } = await pool.query<FoodTracked>(sql, params);

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