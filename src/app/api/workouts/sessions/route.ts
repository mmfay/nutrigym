import { ResponseBuilder as R } from "@/lib/utils/response";
import { getUser } from "@/lib/services/user";
import { listWorkoutSessions, startWorkoutSession } from "@/lib/services/workouts";
import { parseId } from "@/lib/utils/ids";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/workouts/sessions?limit=&offset=  finished workouts, newest first
export async function GET(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const { searchParams } = new URL(req.url);
	const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);
	const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

	try {
		const sessions = await listWorkoutSessions(user.id, limit, offset);
		return R.ok(sessions);
	} catch (err) {
		return R.fromError(err);
	}

}

// POST /api/workouts/sessions  { template_id?, schedule_id?, name? }  starts a workout
export async function POST(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const body = await req.json().catch(() => ({}));

	const template_id = body?.template_id == null ? null : parseId(body.template_id);
	if (body?.template_id != null && !template_id) return R.badRequest("Invalid template id");

	const schedule_id = body?.schedule_id == null ? null : parseId(body.schedule_id);
	if (body?.schedule_id != null && !schedule_id) return R.badRequest("Invalid schedule id");

	try {
		const session = await startWorkoutSession(user.id, { template_id, schedule_id, name: body?.name ?? null });
		return R.created(session, "Workout started");
	} catch (err) {
		return R.fromError(err);
	}

}