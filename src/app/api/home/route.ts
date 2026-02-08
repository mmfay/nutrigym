// app/api/macros/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { getUser, SESSION_COOKIE } from "@/lib/auth/session";
import { getTodayMacros, getTodayGoals, getMacroTrend } from "@/lib/services/macros";
import { getWeightTrend } from "@/lib/services/weight";
import { DEFAULT_GOAL, DEFAULT_TODAY, HomePayload, WeightPoint, MacroGoal, TodayMacros, DayMacros } from "@/lib/dataTypes";

export async function GET() {

    const userid = await getUser();
    const userId = userid?.id; 

    // if no user is clear cookie and return unauthenticated
    if (!userId) {

        const res = NextResponse.json(
            { ok: false, code: "UNAUTHENTICATED", message: "You must be signed in." },
            { status: 401, headers: { "Cache-Control": "no-store" } }
        );
        // Optional: clear stale cookie so clients don’t keep sending it
        res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
        return res;

    }

	// Run queries in parallel
	const [weight, today, goals, macros] = await Promise.all([
		getWeightTrend(userId) as Promise<WeightPoint[]>,
		getTodayMacros(userId) as Promise<TodayMacros>,
		getTodayGoals(userId)  as Promise<MacroGoal>,
		getMacroTrend(userId)  as Promise<DayMacros[]>,
	]);

	const payload: HomePayload = {
		weight: weight ?? [],
		macros: macros ?? [],
		today:  today  ?? DEFAULT_TODAY ,
		goals:  goals  ?? DEFAULT_GOAL,
	};

	// Type-check at compile time
	// (optional, but nice: errors if payload doesn't satisfy HomePayload)
	const checked: HomePayload = payload;

	return NextResponse.json(checked, {
		headers: { "Cache-Control": "no-store" },
	});

}
