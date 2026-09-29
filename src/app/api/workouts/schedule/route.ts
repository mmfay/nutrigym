import { ResponseBuilder as R } from "@/lib/utils/response";
import { getUser } from "@/lib/services/user";
import { getWorkoutCalendar, scheduleWorkout, unscheduleWorkout } from "@/lib/services/workout_schedule";
import { isValidISODate } from "@/lib/utils/date";
import { parseId } from "@/lib/utils/ids";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RANGE_DAYS = 62;

// GET /api/workouts/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const { searchParams } = new URL(req.url);
	const from = searchParams.get("from") ?? "";
	const to = searchParams.get("to") ?? "";

	if (!isValidISODate(from) || !isValidISODate(to)) return R.badRequest("from and to must be YYYY-MM-DD dates");

	const days = (Date.parse(to) - Date.parse(from)) / 86_400_000;
	if (days < 0 || days > MAX_RANGE_DAYS) return R.badRequest(`Range must be 0–${MAX_RANGE_DAYS} days`);

	try {
		return R.ok(await getWorkoutCalendar(user.id, from, to));
	} catch (err) {
		return R.fromError(err);
	}

}

// POST /api/workouts/schedule  { template_id, date }
export async function POST(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const body = await req.json().catch(() => null);
	const template_id = parseId(body?.template_id);

	if (!template_id) return R.badRequest("Invalid template id");
	if (!isValidISODate(body?.date ?? "")) return R.badRequest("date must be YYYY-MM-DD");

	try {
		const id = await scheduleWorkout(user.id, template_id, body.date);
		return R.created({ id }, "Workout planned");
	} catch (err) {
		return R.fromError(err);
	}

}

// DELETE /api/workouts/schedule?id=
export async function DELETE(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const { searchParams } = new URL(req.url);
	const id = parseId(searchParams.get("id"));
	if (!id) return R.badRequest("Invalid id");

	try {
		await unscheduleWorkout(user.id, id);
		return R.ok(null, "Removed from calendar");
	} catch (err) {
		return R.fromError(err);
	}

}