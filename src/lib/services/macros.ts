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
                sum(protein)                as total_protein,
                sum(carbs)                   as total_carbs,
                sum(fat)                    as total_fats
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

// get current users macros for today
export async function getTodayMacros(userId: string) {
    
	const { rows } = await pool.query(
		`
        select 
            sum(calories)   as calories
            ,sum(protein)   as protein
            ,sum(carbs)     as carbs
            ,sum(fat)       as fat
        from food_tracker 
        where 
            user_id = $1
            and recorded_at = current_date;
        `,
		[userId]
	);
    
	return rows[0];

}

// get current users goals for today
export async function getTodayGoals(userId: string) {
    
	const { rows } = await pool.query(
		`
        select 
            calories
            ,protein
            ,carbs
            ,fat
        from macro_goals
        where 
            user_id = $1
            and date_to is null
            ;
        `,
		[userId]
	);
    
	return rows[0];
    
}
