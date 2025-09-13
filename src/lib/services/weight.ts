// lib/services/weight.ts
import pool from "@/lib/db/db";

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
