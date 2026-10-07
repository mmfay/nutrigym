import { ResponseBuilder as R } from "@/lib/utils/response";
import { getUser } from "@/lib/services/user";
import { getTodaysOpenScheduledWorkouts } from "@/lib/services/workout_schedule";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/workouts/schedule/today — planned workouts for today that aren't finished yet
export async function GET() {

	const user = await getUser();
	if (!user) return R.unauthorized();

	try {
		return R.ok(await getTodaysOpenScheduledWorkouts(user.id));
	} catch (err) {
		return R.fromError(err);
	}

}