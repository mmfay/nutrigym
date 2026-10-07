import { ResponseBuilder as R } from "@/lib/utils/response";
import { getUser } from "@/lib/services/user";
import {
	deletePushSubscription,
	getPushPublicKey,
	parseSubscriptionInput,
	savePushSubscription,
} from "@/lib/services/push";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/push/subscription — VAPID public key the browser subscribes with (null = push not set up)
export async function GET() {

	const user = await getUser();
	if (!user) return R.unauthorized();

	return R.ok({ public_key: getPushPublicKey() });

}

// POST /api/push/subscription  PushSubscription.toJSON()
export async function POST(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	if (!getPushPublicKey()) return R.badRequest("Push notifications aren't set up on this server");

	const body = await req.json().catch(() => null);

	try {
		await savePushSubscription(user.id, parseSubscriptionInput(body));
		return R.created(null, "Reminders turned on");
	} catch (err) {
		return R.fromError(err);
	}

}

// DELETE /api/push/subscription?endpoint=
export async function DELETE(req: Request) {

	const user = await getUser();
	if (!user) return R.unauthorized();

	const endpoint = new URL(req.url).searchParams.get("endpoint");
	if (!endpoint) return R.badRequest("Missing endpoint");

	try {
		await deletePushSubscription(user.id, endpoint);
		return R.ok(null, "Reminders turned off");
	} catch (err) {
		return R.fromError(err);
	}

}