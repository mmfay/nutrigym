import { ResponseBuilder as R } from "@/lib/utils/response";
import { getUser } from "@/lib/services/user";
import { addWorkoutSessionExercise, removeWorkoutSessionExercise } from "@/lib/services/workouts";
import { parseId } from "@/lib/utils/ids";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// POST /api/workouts/sessions/:id/exercises  { exercise_id }
export async function POST(req: Request, { params }: Params) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const id = parseId((await params).id);
	if (!id) return R.badRequest("Invalid workout id");

	const body = await req.json().catch(() => null);
	const exercise_id = parseId(body?.exercise_id);
	if (!exercise_id) return R.badRequest("Invalid exercise id");

	try {
		const session = await addWorkoutSessionExercise(user.id, id, exercise_id);
		return R.created(session, "Exercise added");
	} catch (err) {
		return R.fromError(err);
	}

}

// DELETE /api/workouts/sessions/:id/exercises?session_exercise_id=
export async function DELETE(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const { searchParams } = new URL(req.url);
	const session_exercise_id = parseId(searchParams.get("session_exercise_id"));
	if (!session_exercise_id) return R.badRequest("Invalid session exercise id");

	try {
		const session = await removeWorkoutSessionExercise(user.id, session_exercise_id);
		return R.ok(session, "Exercise removed");
	} catch (err) {
		return R.fromError(err);
	}

}