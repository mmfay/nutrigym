import { ResponseBuilder as R } from "@/lib/utils/response";
import { getUser } from "@/lib/services/user";
import {
	deleteWorkoutTemplate,
	getUserWorkoutTemplates,
	parseTemplateInput,
	saveWorkoutTemplate,
} from "@/lib/services/workout_templates";
import { parseId } from "@/lib/utils/ids";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {

	const user = await getUser();
	if (!user) return R.unauthorized();

	try {
		return R.ok(await getUserWorkoutTemplates(user.id));
	} catch (err) {
		return R.fromError(err);
	}

}

// POST /api/workouts/templates  { name, notes?, exercises: [{ exercise_id, target_sets, target_reps?, target_weight?, target_duration_seconds? }] }
export async function POST(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const body = await req.json().catch(() => null);

	try {
		const template = await saveWorkoutTemplate(user.id, parseTemplateInput(body));
		return R.created(template, "Template created");
	} catch (err) {
		return R.fromError(err);
	}

}

// PATCH /api/workouts/templates?id=  same body as POST, replaces the template
export async function PATCH(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const { searchParams } = new URL(req.url);
	const id = parseId(searchParams.get("id"));
	if (!id) return R.badRequest("Invalid template id");

	const body = await req.json().catch(() => null);

	try {
		const template = await saveWorkoutTemplate(user.id, parseTemplateInput(body), id);
		return R.ok(template, "Template updated");
	} catch (err) {
		return R.fromError(err);
	}

}

// DELETE /api/workouts/templates?id=
export async function DELETE(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const { searchParams } = new URL(req.url);
	const id = parseId(searchParams.get("id"));
	if (!id) return R.badRequest("Invalid template id");

	try {
		await deleteWorkoutTemplate(user.id, id);
		return R.ok(null, "Template deleted");
	} catch (err) {
		return R.fromError(err);
	}

}