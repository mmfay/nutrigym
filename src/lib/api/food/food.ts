import { Food, FoodInput, FoodTracked, NewFood} from "@/lib/dataTypes";

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

// fetches weekly macro trend
export async function fetchTracking(date: string): Promise<FoodTracked[]> {
    
    // if no date, get todays date.
    const d = date ?? new Date();

    const res = await fetch(`/api/food/tracking/get?date=${encodeURIComponent(date)}`, {
        credentials: "include",
    });

    if (!res.ok) 
        throw new Error(`Failed to fetch tracking: ${res.status} ${res.statusText}`);

    return res.json();

}

// posts weight on date, returns array of weights for graph
export async function addToTracking(foodItem: Food, meal: number, trackingDate: String): Promise<Response> {

    const res = await fetch("/api/food/tracking/add", {
        method: "POST",
        credentials: "include", // keep cookies/session if you’re using them
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            foodItem,
            meal,
            date: trackingDate,
        }),
    });

    if (!res.ok) {
        throw new Error(`Failed to add new weight: ${res.statusText}`);
    }

    return res.json();

}

// posts weight on date, returns array of weights for graph
export async function removeFromTracking(id: number): Promise<Food[]> {
    
    const res = await fetch(`/api/food/tracking/remove?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include", // keep cookies/session if you’re using them
    });

    if (!res.ok) {
        throw new Error(`Failed to add new weight: ${res.statusText}`);
    }

    return res.json();

}

/**
 * Adds new food to database to select from
 */
export async function addFood(foodItem: FoodInput): Promise<Response> {
    
    const res = await fetch("/api/food/items/add", {
        method: "POST",
        credentials: "include", // keep cookies/session if you’re using them
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            foodItem
        }),
    });
    
    if (!res.ok) {
        throw new Error(`Failed to add new food: ${res.statusText}`);
    }

    return res.json();

}