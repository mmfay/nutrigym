export const runtime = "nodejs";

import { ResponseBuilder as R } from "@/lib/utils/response";
import { getUserFromApiKey } from "@/lib/auth/apikey";
import { getWorkoutSessionsForDays } from "@/lib/services/workouts";

const MAX_DAYS = 365;

export async function GET(req: Request) {

	const user = await getUserFromApiKey(req);

	if (!user) {
		return R.unauthorized("Invalid or missing API key.");
	}

	try {

		const { searchParams } = new URL(req.url);

		const daysParam = searchParams.get("days");

		let days = 28;

		if (daysParam !== null) {

			const parsed = Number(daysParam);

			if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_DAYS) {
				return R.badRequest(`Days must be an integer between 1 and ${MAX_DAYS}`);
			}

			days = parsed;

		}

		const data = await getWorkoutSessionsForDays(user.id, days);

		return R.ok(data, "Successfully retrieved workouts.");

	} catch (err: any) {
		console.error("DB error:", err);
		return R.serverError("Server Error");
	}

}