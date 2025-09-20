// lib/api/weight.ts
import { WeightPoint } from "@/lib/dataTypes";

// fetches date and weight
export async function fetchWeightTrend(): Promise<WeightPoint[]> {
    const res = await fetch("/api/weight/trend", {
      method: "GET",
      credentials: "include", // keep cookies/session if you’re using them
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch weight trend: ${res.statusText}`);
    }

    return res.json();
}

// posts weight on date, returns array of weights for graph
export async function addNewWeight(weight: number, dayOfWeight: string): Promise<WeightPoint[]> {

    const res = await fetch("/api/weight/add", {
		method: "POST",
		credentials: "include", // keep cookies/session if you’re using them
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			weight,
			date: dayOfWeight,
		}),
    });

    if (!res.ok) {
		throw new Error(`Failed to add new weight: ${res.statusText}`);
    }

    return res.json();

}
