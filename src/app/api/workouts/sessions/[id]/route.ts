import { ResponseBuilder as R } from "@/lib/utils/response";
import { getUser } from "@/lib/services/user";
import { deleteWorkoutSession, getWorkoutSession, updateWorkoutSession } from "@/lib/services/workouts";
import { parseId } from "@/lib/utils/ids";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const id = parseId((await params).id);
	if (!id) return R.badRequest("Invalid workout id");

	try {
		return R.ok(await getWorkoutSession(user.id, id));
	} catch (err) {
		return R.fromError(err);
	}

}

// PATCH /api/workouts/sessions/:id  { name?, notes?, finish? }
export async function PATCH(req: Request, { params }: Params) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const id = parseId((await params).id);
	if (!id) return R.badRequest("Invalid workout id");

	const body = await req.json().catch(() => null);
	if (!body) return R.badRequest("Missing body");

	if (body.name !== undefined && (typeof body.name !== "string" || !body.name.trim())) {
		return R.badRequest("Workout name can't be empty");
	}
	if (body.notes !== undefined && body.notes !== null && typeof body.notes !== "string") {
		return R.badRequest("Notes must be text");
	}

	try {
		const session = await updateWorkoutSession(user.id, id, {
			name: body.name,
			notes: body.notes === undefined ? undefined : (body.notes?.trim() || null),
			finish: body.finish === true,
		});
		return R.ok(session, body.finish ? "Workout finished" : "Workout updated");
	} catch (err) {
		return R.fromError(err);
	}

}

export async function DELETE(_req: Request, { params }: Params) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const id = parseId((await params).id);
	if (!id) return R.badRequest("Invalid workout id");

	try {
		await deleteWorkoutSession(user.id, id);
		return R.ok(null, "Workout deleted");
	} catch (err) {
		return R.fromError(err);
	}

}
