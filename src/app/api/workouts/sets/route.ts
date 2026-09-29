import { ResponseBuilder as R } from "@/lib/utils/response";
import { getUser } from "@/lib/services/user";
import { addWorkoutSet, deleteWorkoutSet, parseSetInput, updateWorkoutSet } from "@/lib/services/workouts";
import { parseId } from "@/lib/utils/ids";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/workouts/sets  { session_exercise_id, weight?, reps?, duration_seconds?, distance?, is_warmup? }
export async function POST(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const body = await req.json().catch(() => null);
	const session_exercise_id = parseId(body?.session_exercise_id);
	if (!session_exercise_id) return R.badRequest("Invalid session exercise id");

	try {
		const session = await addWorkoutSet(user.id, session_exercise_id, parseSetInput(body));
		return R.created(session, "Set logged");
	} catch (err) {
		return R.fromError(err);
	}

}

// PATCH /api/workouts/sets?id=  { weight?, reps?, duration_seconds?, distance?, is_warmup? }
export async function PATCH(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const { searchParams } = new URL(req.url);
	const id = parseId(searchParams.get("id"));
	if (!id) return R.badRequest("Invalid set id");

	const body = await req.json().catch(() => null);

	try {
		const session = await updateWorkoutSet(user.id, id, parseSetInput(body));
		return R.ok(session, "Set updated");
	} catch (err) {
		return R.fromError(err);
	}

}

// DELETE /api/workouts/sets?id=
export async function DELETE(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const { searchParams } = new URL(req.url);
	const id = parseId(searchParams.get("id"));
	if (!id) return R.badRequest("Invalid set id");

	try {
		const session = await deleteWorkoutSet(user.id, id);
		return R.ok(session, "Set deleted");
	} catch (err) {
		return R.fromError(err);
	}

}