// app/api/weight/add/route.ts
import { logFood, getFoodLog, removeFood, logAIFood, updateTrackedFood } from "@/lib/services/tracking";
import { Food } from "@/lib/dataTypes";
import { ResponseBuilder as R } from "@/lib/utils/response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { getUser, SESSION_COOKIE } from "@/lib/auth/session";
import { getUserID } from "@/lib/services/user";

export async function POST(req: Request) {

	try {
		
		const userId = await getUserID();
	
		const { foodItem, meal, loggedDate } = (await req.json()) as {
			foodItem: Food;
			meal: number;
			loggedDate: Date;
		};

		if (foodItem.isAI || foodItem.id === null) {
			const result = await logAIFood(userId, meal, loggedDate, foodItem);
			return R.ok(result, "Food Tracked Successfully");
		}

		const newLog = await logFood(userId, meal, loggedDate, foodItem);
		return R.ok(newLog, "Food Tracked Successfully");

	} catch (err) {

		console.log(err);
		if (err instanceof Response) return err;

		return R.serverError("Error Tracking Food");

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
	const date = url.searchParams.get("date");

	if (!date) return R.badRequest("Date Missing from Request");

	try {
		const tracked = await getFoodLog(userId, date);
		return R.ok(tracked, "Tracked food loaded");
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

// PATCH /api/food/log  { id, meal, serving_size }
export async function PATCH(req: Request) {

	try {

		const userId = await getUserID();

		const body = await req.json().catch(() => null);

		const id = Number(body?.id);
		const meal = Number(body?.meal);
		const servingSize = Number(body?.serving_size);

		if (!Number.isInteger(id) || id <= 0) {
			return R.badRequest("Invalid log id.");
		}

		if (!Number.isInteger(meal) || meal < 0 || meal > 3) {
			return R.badRequest("Invalid meal.");
		}

		if (!Number.isFinite(servingSize) || servingSize <= 0) {
			return R.badRequest("Quantity must be greater than 0.");
		}

		const updated = await updateTrackedFood(userId, id, meal, servingSize);

		if (!updated) return R.notFound("Logged food not found.");

		return R.ok(updated, "Logged food updated");

	} catch (err: any) {

		if (err instanceof Response) return err;

		// numeric column overflow
		if (err?.code === "22003") return R.badRequest("Quantity is too large.");

		console.error(err);
		return R.serverError("Error updating logged food");

	}

}
