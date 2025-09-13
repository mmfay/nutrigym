// lib/api/macros/macros.ts
import { DayMacros } from "@/lib/dataTypes";

// fetches weekly macro trend
export async function fetchMacroTrend(): Promise<DayMacros[]> {
    const res = await fetch("/api/macros/trend", {
      method: "GET",
      credentials: "include", // keep cookies/session if you’re using them
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch weight trend: ${res.statusText}`);
    }

    return res.json();
}
