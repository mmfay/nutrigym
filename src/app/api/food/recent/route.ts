// app/api/food/recent/breakfast/route.ts
import { NextResponse } from "next/server";
import { getRecentFood } from "@/lib/services/food";
import { getUser, SESSION_COOKIE } from "@/lib/auth/session";
import { ResponseBuilder as R } from "@/lib/utils/response";
import { MealNum } from "@/lib/dataTypes/enums";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {

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

	const url = new URL(req.url);
	const mealStr = url.searchParams.get("meal"); // string | null

	if (!mealStr || !(mealStr in MealNum)) {
		return R.badRequest("Invalid or missing meal");
	}

	const mealNum = Number(mealStr);

	// get recents
	const data = await getRecentFood(userId, mealNum);

	return R.ok( data, "Successfully retrieved recents");

}
