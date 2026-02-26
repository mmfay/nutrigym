// lib/api/weight.ts
import { WeightCreate, Weight, WeightPoint } from "@/lib/dataTypes";
import { postJSON } from "../submissions";
import { ApiResult } from "@/lib/dataTypes/results";

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

// posts weight on date, returns new weight
export async function addNewWeight(newWeight: WeightCreate): Promise<ApiResult<Weight>> {
	return postJSON("/api/weight/add", newWeight);
}
