// app/api/weight/add/route.ts
import { removeFood } from "@/lib/services/tracking";
import { ResponseBuilder as R } from "@/lib/utils/response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { getUser, SESSION_COOKIE } from "@/lib/auth/session";

export async function DELETE(req: Request) {

	const { searchParams } = new URL(req.url);
	const id = searchParams.get("id");
	if (!id) {
		return
	}
	const userid = await getUser();
	const userId = userid?.id; 

	// if no user is clear cookie and return unauthenticated
	if (!userId) {

		const res = R.unauthorized();

		// Optional: clear stale cookie so clients don’t keep sending it
		res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
		return res;

	}

	await removeFood(userId, Number(id));
	
		
	return R.ok({}, "Food deleted Successfully");

}
