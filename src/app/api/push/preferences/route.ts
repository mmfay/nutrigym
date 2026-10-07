import { ResponseBuilder as R } from "@/lib/utils/response";
import { getUser } from "@/lib/services/user";
import { getReminderPreferences, parseReminderPreferences, saveReminderPreferences } from "@/lib/services/push";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/push/preferences — reminder times for the user (all of their devices)
export async function GET() {

	const user = await getUser();
	if (!user) return R.unauthorized();

	try {
		return R.ok(await getReminderPreferences(user.id));
	} catch (err) {
		return R.fromError(err);
	}

}

// PATCH /api/push/preferences  { workout_time, breakfast_time, lunch_time, dinner_time } — minutes after midnight or null (off)
export async function PATCH(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const body = await req.json().catch(() => null);

	try {
		const prefs = await saveReminderPreferences(user.id, parseReminderPreferences(body));
		return R.ok(prefs, "Reminder times saved");
	} catch (err) {
		return R.fromError(err);
	}

}