// lib/services/macros.ts
import pool from "@/lib/db/db";

export async function getMacroTrend(userId: string, days = 14) {
    
	const { rows } = await pool.query(
		`
        with days as (
            select generate_series(
                    current_date - (7::int - 1),
                    current_date,
                    interval '1 day'
                    )::date as date
        ),
        agg as (
            select
                recorded_at::date            as date,
                sum(proteins)                as total_protein,
                sum(carbs)                   as total_carbs,
                sum(fats)                    as total_fats
            from food_tracker
            where user_id = $1
                and recorded_at >= current_date - (7::int - 1)
            group by recorded_at::date
        )
        select
            to_char(d.date, 'Dy')          as date,    -- Mon, Tue, ...
            coalesce(a.total_protein, 0)   as protein,
            coalesce(a.total_carbs,   0)   as carbs,
            coalesce(a.total_fats,    0)   as fat
        from days d
        left join agg a using (date)
        order by 
            d.date;
        `,
		[userId]
	);

	return rows;

}
