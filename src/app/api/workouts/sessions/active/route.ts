import { ResponseBuilder as R } from "@/lib/utils/response";
import { getUser } from "@/lib/services/user";
import { getActiveWorkoutSession } from "@/lib/services/workouts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/workouts/sessions/active  the in-progress workout, or null
export async function GET() {

	const user = await getUser();
	if (!user) return R.unauthorized();

	try {
		const session = await getActiveWorkoutSession(user.id);
		return R.ok(session);
	} catch (err) {
		return R.fromError(err);
	}

}