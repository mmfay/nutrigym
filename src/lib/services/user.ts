import { NextResponse } from "next/server";
import { getUser, SESSION_COOKIE } from "@/lib/auth/session";

export async function getUserID(){

	const user = await getUser();
	const userID = user?.id; 

	// if no user is clear cookie and return unauthenticated
	if (!userID) {

		const res = NextResponse.json(
			{ ok: false, code: "UNAUTHENTICATED", message: "You must be signed in." },
			{ status: 401, headers: { "Cache-Control": "no-store" } }
		);
		// Optional: clear stale cookie so clients don’t keep sending it
		res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
		return res;

	}

	return userID;

}