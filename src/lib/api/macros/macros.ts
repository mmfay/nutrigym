// lib/api/macros/macros.ts
import { MacroGoal, MacroGoalCreate } from "@/lib/dataTypes";
import { ApiResult } from "@/lib/dataTypes/results";
import { postJSON } from "../submissions";

/**
 * Adds new food to database to select from
 */
export async function createMacroGoals(newGoals: MacroGoalCreate): Promise<ApiResult<MacroGoal>> {
	return postJSON("/api/macros/goals", { newGoals });
}
