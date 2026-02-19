import { Food, FoodInput, FoodTracked, FoodCreate} from "@/lib/dataTypes";

import { postJSON, getJSON, deleteJSON } from "../submissions";
import { ApiResult } from "@/lib/dataTypes/results";

// fetches weekly macro trend
export async function fetchRecentByMeal(meal: string): Promise<Food[]> {

    const res = await fetch(`/api/food/recent/${meal}`, {
        method: "GET",
        credentials: "include", // keep cookies/session if you’re using them
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch recent ${meal}: ${res.statusText}`);
    }

    return res.json();

}

// search for food
export async function searchFood(food: string): Promise<Food[]> {

    const checkFood = food ?? "";

    const res = await fetch(`/api/food/search?text=${encodeURIComponent(checkFood)}`, {
        method: "GET",
        credentials: "include", // keep cookies/session if you’re using them
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch food`);
    }
    
    const data: Food[] = await res.json();
    
    return data;

}

/**
 * Adds new food to database to select from
 */
export async function createFood(newFood: FoodCreate): Promise<ApiResult<Food>> {
	return postJSON("/api/food/items", { newFood });
}

/**
 * Logs a food to a meal/date
 */
export async function logFood(foodItem: Food, meal: number, loggedDate: String): Promise<ApiResult<FoodTracked>> {
	return postJSON("/api/food/log", { foodItem, meal, loggedDate });
}

/**
 * Gets the food log for a user on a specific date
 */
export async function fetchFoodLog(date: String): Promise<ApiResult<FoodTracked[]>> {
	return getJSON("/api/food/log", { date });
}

/**
 * Delete a users tracked food
 */
export async function deleteFoodLog(id: number): Promise<ApiResult<FoodTracked[]>> {
	return deleteJSON("/api/food/log", { id });
}