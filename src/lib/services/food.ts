// lib/services/food.ts
import pool from "@/lib/db/db";
import { FoodCreate, Food } from "../dataTypes";

// get recent foods for selection
export async function getRecentFood(userId: string, meal: number | null, limit = 10) {
	
	// DISTINCT ON keeps each food's latest log; outer query orders those by recency
	const sql = `
		SELECT r.*
		FROM (
			SELECT DISTINCT ON (v.food_id)
				v.food_id     AS id,
				v.food_name   AS name,
				v.food_serving_size  AS serving_size,
				v.food_serving_unit  AS serving_unit,
				v.food_protein_per_serving  AS protein,
				v.food_carbs_per_serving    AS carbs,
				v.food_fat_per_serving      AS fat,
				v.food_calories_per_serving AS calories,
				v.brand,
				v.serving_metric_size,
				v.serving_metric_unit,
				v.is_verified,
				v.recorded_at
			FROM food_log_v v
			WHERE 
				v.user_id = $1
				AND v.meal = $2
				AND v.food_id IS NOT NULL
			ORDER BY 
				v.food_id, 
				v.recorded_at DESC
		) r
		ORDER BY r.recorded_at DESC
		LIMIT $3;
	`;

	const params = [userId, meal ?? null, limit];

	const { rows } = await pool.query<Food[]>(sql, params);

	return rows;

}


// add new food to database
export async function addNewFood(food: FoodCreate, is_sys_admin: boolean = false) {

	const barcode =
		food.barcode && food.barcode.trim() !== ""
			? food.barcode.trim()
			: null;

	const sql = `
		INSERT INTO food (name, brand, barcode, serving_size, serving_unit, serving_type, protein, carbs, fat, calories, serving_metric_size, serving_metric_unit, is_verified) 
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
	`;

	const params = [food.name, 
					food.brand ?? 'Generic', 
					barcode,
					food.serving_size, 
					food.serving_unit,
					food.serving_type,
					food.protein,
					food.carbs, 
					food.fat, 
					food.calories,
					food.serving_metric_size,
					food.serving_metric_unit,
					is_sys_admin
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
		WHERE 
			name ILIKE '%' || $1 || '%'
			OR COALESCE(brand, '') ILIKE '%' || $1 || '%'
		LIMIT 10;
	`;

	const params = [textStr];

	const { rows } = await pool.query<Food[]>(sql, params);

	return rows;

}

/**
 * The same product's barcode as scanners may report it: UPC-A (12 digits) is often read
 * as EAN-13 with a leading 0, and the other way round.
 */
function barcodeVariants(code: string) {

	const variants = new Set([code]);

	if (code.length === 12) variants.add(`0${code}`);
	if (code.length === 13 && code.startsWith("0")) variants.add(code.slice(1));

	return [...variants];

}

/**
 * Exact barcode lookup (UPC/EAN). Returns an empty list for anything that isn't 6–14 digits.
 */
export async function findFoodsByBarcode(barcode: string) {

	const code = barcode.replace(/\s+/g, "");
	if (!/^\d{6,14}$/.test(code)) return [];

	const { rows } = await pool.query<Food>(
		`SELECT * FROM food WHERE barcode = ANY($1::text[]) ORDER BY is_verified DESC, id LIMIT 10`,
		[barcodeVariants(code)]
	);

	return rows;

}