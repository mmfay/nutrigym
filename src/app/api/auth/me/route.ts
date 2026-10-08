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
		const res = R.unauthorized("Unauthorized");
		res.cookies.set({ name: SESSION_COOKIE, value: "", path: "/", maxAge: 0 });
		return res;
	}

	// get user so we can check for permissions on request
	const { rows } = await pool.query(
		`select u.id, u.name, u.email, u.is_sys_admin,
			(extract(epoch from a.updated_at) * 1000)::bigint::text as avatar_version
		 from users u
		 left join user_avatars a on a.user_id = u.id
		 where u.id = $1 limit 1`,
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
		id: u.id, name: u.name, email: u.email, is_sys_admin: u.is_sys_admin, avatar_version: u.avatar_version
	}

	return R.ok(user, "User is Authenticated");

}