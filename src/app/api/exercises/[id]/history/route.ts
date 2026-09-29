import { ResponseBuilder as R } from "@/lib/utils/response";
import { getUser } from "@/lib/services/user";
import { getExerciseHistory } from "@/lib/services/workouts";
import { parseId } from "@/lib/utils/ids";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// GET /api/exercises/:id/history  last finished performance + progression points
export async function GET(_req: Request, { params }: Params) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const id = parseId((await params).id);
	if (!id) return R.badRequest("Invalid exercise id");

	try {
		return R.ok(await getExerciseHistory(user.id, id));
	} catch (err) {
		return R.fromError(err);
	}

}