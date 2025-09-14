// lib/api/macros/macros.ts
import { DayMacros, TodayMacros, MacroGoal } from "@/lib/dataTypes";
import { normalizeGoal, normalizeToday } from "@/lib/dataTypes";
import { DEFAULT_GOAL, DEFAULT_TODAY } from "@/lib/dataTypes";

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

// fetches daily macros
export async function fetchDailyMacros(): Promise<TodayMacros> {
    const res = await fetch("/api/macros/daily", {
      method: "GET",
      credentials: "include", // keep cookies/session if you’re using them
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch weight trend: ${res.statusText}`);
    }

    const json = await res.json().catch(() => null);
    return json ? normalizeToday(json) : DEFAULT_TODAY;
}

// fetches daily macro goals
export async function fetchDailyMacroGoals(): Promise<MacroGoal> {
    const res = await fetch("/api/macros/goals", {
      method: "GET",
      credentials: "include", // keep cookies/session if you’re using them
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch weight trend: ${res.statusText}`);
    }

    const json = await res.json().catch(() => null);
    return json ? normalizeGoal(json) : DEFAULT_GOAL;
}
