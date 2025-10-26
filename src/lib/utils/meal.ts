/**
 * Helper functions for meals
 */

/**
 * finds the current type and decides what meal that is.
 */
export function mealForNow(date = new Date()): Meal {

	const h = date.getHours();

	if (h >= 5 && h < 11) return "breakfast";
	if (h >= 11 && h < 16) return "lunch";
	if (h >= 16 && h < 22) return "dinner";
	
	return "snack";

}

/**
 * different meal types
 */
export type Meal = "breakfast" | "lunch" | "dinner" | "snack";