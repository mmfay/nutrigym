import { Food, FoodTracked, FoodCreate, FoodMacros} from "@/lib/dataTypes";

import { postJSON, getJSON, deleteJSON, patchJSON, postFormData } from "../submissions";
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
export async function searchFoodOld(food: string): Promise<Food[]> {

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
 * Gets the food log for a user on a specific date
 */
export async function searchFood(text: String): Promise<ApiResult<Food[]>> {
	return getJSON("/api/food/search", { text });
}

// exact barcode (UPC/EAN) lookup
export async function searchFoodByBarcode(barcode: string): Promise<ApiResult<Food[]>> {
	return getJSON("/api/food/search", { barcode });
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
 * Update the meal and quantity of a users tracked food
 */
export async function updateFoodLog(id: number, meal: number, servingSize: number): Promise<ApiResult<FoodTracked>> {
	return patchJSON("/api/food/log", { id, meal, serving_size: servingSize });
}

/**
 * Delete a users tracked food
 */
export async function deleteFoodLog(id: number): Promise<ApiResult<FoodTracked[]>> {
	return deleteJSON("/api/food/log", { id });
}

/**
 * Clear a user's entire tracking history
 */
export async function clearFoodLog(): Promise<ApiResult<null>> {
	return deleteJSON("/api/food/log/clear");
}

/**
 * Get Recent Foods by Meal
 */
export async function getRecentFoods(meal: number): Promise<ApiResult<Food[]>> {
	return getJSON("/api/food/recent", { meal });
}

/**
 * Post Photo to AI to get Macros
 */
export async function getMacroData(photo: Blob): Promise<ApiResult<FoodMacros>> {
	const fd = new FormData();
	fd.append("image", photo, "photo.jpg");
	return postFormData("/api/food/image", fd);
}

/**
 * Copy a meal from the previous day into toDate
 */
export async function copyMeal(meal: number, toDate: string): Promise<ApiResult<FoodTracked[]>> {
	return postJSON("/api/food/log/copy", { meal, toDate });
}

/**
 * Get Remaining AI Requests
 */
export async function getRemainingAIRequests(): Promise<ApiResult<{requests: number}>> {
	return getJSON("/api/food/image");
}