// app/api/me/route.ts
import { NextResponse } from "next/server";
import { ResponseBuilder as R } from "@/lib/utils/response";
import { getSession, SESSION_COOKIE } from "@/lib/auth/session";
import pool from "@/lib/db/db";

export const dynamic = "force-dynamic"; // avoid caching

export async function GET() {
	
	// get the session
	const sess = await getSession();

	if (!sess) {
		return NextResponse.json({ user: null, permissions: [] }, { status: 200 });
	}

	// get user so we can check for permissions on request
	const { rows } = await pool.query(
		`select id, name, email from users where id = $1 limit 1`,
		[sess.user_id]
	);

	const u = rows[0];

	// If session exists but user was deleted: clean up & clear cookie
	if (!u) {
		const res = NextResponse.json({ user: null, permissions: [] }, { status: 200 });
		res.cookies.set({ name: SESSION_COOKIE, value: "", path: "/", maxAge: 0 });
		await pool.query(`delete from auth_sessions where user_id = $1`, [sess.user_id]);
		return res;
	}

	const user = {
		id: u.id, name: u.name, email: u.email
	}

	return R.ok(user, "User is Authenticated");

}
