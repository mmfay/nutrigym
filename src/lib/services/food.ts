// lib/services/food.ts
import pool from "@/lib/db/db";
import { FoodInput } from "../schemas/food";
import { FoodCreate } from "../dataTypes";

// get recent foods for selection
export async function getRecentFood(userId: string, meal: number | null, limit = 10) {

	const sql = `
	SELECT *
	FROM (
		SELECT DISTINCT ON (food_id)
			food_id					          AS id,
			food_name				          AS name,
			brand,
			food_serving_size          AS serving_size,
			food_serving_unit          AS serving_unit,
			food_protein_per_serving		AS protein,
			food_carbs_per_serving		  AS carbs,
			food_fat_per_serving			  AS fat,
			food_calories_per_serving	AS calories,
			recorded_at                AS last_used,
			entry_id                   AS last_entry_id,
			meal,
			meal_name
		FROM v_food_log
		WHERE user_id = $1::uuid
		AND ($2::int IS NULL OR meal = $2::int)
		ORDER BY food_id, recorded_at DESC, entry_id DESC
	) x
	ORDER BY x.last_used DESC, x.last_entry_id DESC
	LIMIT $3::int;
	`;

	const params = [userId, meal ?? null, limit];

	const { rows } = await pool.query(sql, params);

	return rows;

}


// get recent foods for selection
export async function addNewFood(food: FoodCreate) {
	console.log(food);
	const sql = `
	insert into food (name, brand, barcode, serving_size, serving_unit, serving_type, protein, carbs, fat, calories) values
  		($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
	`;

	const params = [food.name, 
					food.brand ?? 'Generic', 
					food.barcode, 
					food.serving_size, 
					food.serving_unit,
					'Count',
					food.protein,
					food.carbs, 
					food.fat, 
					food.calories
	];

	const { rows } = await pool.query(sql, params);

	return rows;

}

/*
	Gets list of food from database
*/
export async function findFoods(textStr: string) {
	
	const sql = `
SELECT *
FROM food
WHERE name  ILIKE '%' || $1 || '%'
   OR COALESCE(brand, '') ILIKE '%' || $1 || '%'
   LIMIT 10;

	`;

	const params = [textStr];

	const { rows } = await pool.query(sql, params);

	console.log(rows);
	return rows;

}