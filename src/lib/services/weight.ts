// lib/services/weight.ts
import pool from "@/lib/db/db";
import { Weight } from "../dataTypes";
import { ResponseBuilder as R } from "../utils/response";

export async function getWeightTrend(userId: string, days = 14) {

	const { rows } = await pool.query(
		`select 
			measured_at::text as date
			,weight 
		from weight 
		where user_id=$1 and measured_at >= now() - interval '${days} days'
		order by measured_at asc`,
		[userId]
	);
	return rows;

}

// adds weight and if old date specified it updates it, then returns trend to front end
export async function addWeight(userId: string, dateOfWeight: Date, weight: number) {

	const sql = `
	INSERT INTO WEIGHT (user_id, measured_at, weight, unit)
		VALUES ($1, $2::date, $3, 'lb')
		ON CONFLICT (user_id, measured_at)
		DO UPDATE SET
  			weight = EXCLUDED.weight
		RETURNING id, measured_at::text AS measured_at, weight;
	`;

	const { rows } = await pool.query<Weight>(sql, [userId, dateOfWeight, weight]);

	if (!rows) {
		return R.serverError("Not able to create weight, try again");
	}

	return rows[0];

}
