import { ResponseBuilder as R } from "@/lib/utils/response";
import { getUser } from "@/lib/services/user";
import { sendTestPush } from "@/lib/services/push";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/push/test — pushes a test reminder to every device the user turned reminders on for
export async function POST() {

	const user = await getUser();
	if (!user) return R.unauthorized();

	try {
		const sent = await sendTestPush(user.id);
		return R.ok({ sent }, sent ? "Test reminder sent" : "Couldn't reach any of your devices");
	} catch (err) {
		return R.fromError(err);
	}

}