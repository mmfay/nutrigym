// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db/db";                // if you store sessions in DB
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function POST() {
	
	const cookieStore = await cookies();
	const sid = cookieStore.get(SESSION_COOKIE)?.value;

	// If you keep a server-side session, invalidate it
	if (sid) {
		try {
			await pool.query(`delete from sessions where id = $1`, [sid]);
		} catch (e) {
			// don't leak errors to client—logging is fine
			console.error("logout: failed to delete session", e);
		}
	}

	// Clear the cookie
	const res = NextResponse.json({ ok: true });

	res.cookies.set(SESSION_COOKIE, "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		expires: new Date(0),        // expire immediately
	});

	return res;
	
}
