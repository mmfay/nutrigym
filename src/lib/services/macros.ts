// lib/services/macros.ts
import pool from "@/lib/db/db";
import { DayMacros, MacroGoal, MacroGoalCreate } from "../dataTypes";
import { ResponseBuilder as R } from "../utils/response";

export async function getMacroTrend(userId: string, userDate: string, days = 14) {
    
	const sql = `
			with days as (
				select generate_series(
						current_date - (7::int - 1),
						current_date,
						interval '1 day'
						)::date as date
			), agg as (
				select
					recorded_at           as date
					,sum(protein)         as total_protein
					,sum(carbs)           as total_carbs
					,sum(fat)             as total_fats
				from food_tracker
				where user_id = $1
					and recorded_at >= ($2::date) - (7::int - 1)
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
	`;

	const { rows } = await pool.query<DayMacros[]>(sql, [userId, userDate]);

	if (!rows) {
		return { macros: null }
	}

	return rows;

}

// get current users macros for today
export async function getTodayMacros(userId: string, userDate: string) {
    
	const sql = `
        select 
            COALESCE(sum(calories),0)  as calories
            ,COALESCE(sum(protein),0)   as protein
            ,COALESCE(sum(carbs),0)    as carbs
            ,COALESCE(sum(fat),0)       as fat
        from food_tracker 
        where 
            user_id = $1
            and recorded_at = $2;
    `;

	const { rows } = await pool.query(sql, [userId, userDate]);
	
	if (!rows) {
		return {macros: {calories: 0, protein: 0, carbs: 0, fat: 0}};
	}
    
	return rows[0];

}

// get current users goals for today
export async function getTodayGoals(userId: string) {
    
	const sql = `
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
    `;

	const { rows } = await pool.query(sql, [userId]);

	if (!rows) {
		return { goals: null };
	}
    
	return rows[0];
    
}

// get current users goals for today
export async function setMacroGoals(userId: string, goal: MacroGoalCreate) {
    console.log(`USERID: ${userId}, GOAL: ${goal}`);
	
	const sql = `
		INSERT INTO macro_goals (calories, protein, carbs, fat, user_id, date_from) 
		VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
		RETURNING id, calories, protein, carbs, fat;
    `;

	const { rows } = await pool.query<MacroGoal>(sql, [goal.calories, goal.protein, goal.carbs, goal.fat, userId]);

	if (!rows) {
		return R.serverError("Server was not able to process new Goal, please retry");
	}
    
	return rows[0];
    
}
