// app/api/weight/add/route.ts
import { NextResponse } from "next/server";
import { getFoodLog } from "@/lib/services/tracking";
import { Food } from "@/lib/dataTypes";
import { ResponseBuilder as R } from "@/lib/utils/response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { getUser, SESSION_COOKIE } from "@/lib/auth/session";

export async function GET(req: Request) {

	const { searchParams } = new URL(req.url);
	const date = searchParams.get("date");

	// if data isn't in query, return
	if (!date) {
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

	console.log(`Get Date: ${date}`);
	
	const data = await getFoodLog(userId, date);
		
	return R.ok({data}, "Food retrieved Successfully");

}
