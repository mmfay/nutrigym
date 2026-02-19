// app/api/weight/add/route.ts
import { logFood, getFoodLog, removeFood } from "@/lib/services/tracking";
import { Food } from "@/lib/dataTypes";
import { ResponseBuilder as R } from "@/lib/utils/response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { getUser, SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(req: Request) {

	const userid = await getUser();
	const userId = userid?.id; 

	// if no user is clear cookie and return unauthenticated
	if (!userId) {

		const res = R.unauthorized();

		// Optional: clear stale cookie so clients don’t keep sending it
		res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
		return res;

	}

	const { foodItem, meal, loggedDate } = (await req.json()) as {
		foodItem: Food;
		meal: number;
		loggedDate: Date;
	};

	try {
		const newLog = await logFood(userId, meal, loggedDate, foodItem);
		return R.ok(newLog, "Food Tracked Successfully");
	} catch (err) {
		console.log(err);
		return R.serverError("Error Loggin Food");
	}
		
	
}


// GET /api/food/log?date=2026-02-18
export async function GET(req: Request) {

	const userid = await getUser();
	const userId = userid?.id;

	// if no user is clear cookie and return unauthenticated
	if (!userId) {

		const res = R.unauthorized();

		// Optional: clear stale cookie so clients don’t keep sending it
		res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
		return res;

	}

	const url = new URL(req.url);
	const date = url.searchParams.get("date"); // YYYY-MM-DD from your todayLocalISO

	if (!date) return R.badRequest("Date Missing from Request");

	try {
		// You decide what this returns: lines, totals, grouped by meal, etc.
		const tracked = await getFoodLog(userId, date);
		return R.ok( tracked , "Tracked food loaded");
	} catch (err) {
		console.error(err);
		return R.serverError("Failed to load tracked food");
	}
}

export async function DELETE(req: Request) {

	const { searchParams } = new URL(req.url);
	const id = searchParams.get("id");
	if (!id) {
		return;
	}

	const userid = await getUser();
	const userId = userid?.id;

	// if no user is clear cookie and return unauthenticated
	if (!userId) {

		const res = R.unauthorized();

		// Optional: clear stale cookie so clients don’t keep sending it
		res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
		return res;

	}

	await removeFood(userId, Number(id));
		
	return R.ok({}, "Food deleted Successfully");

}
