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
