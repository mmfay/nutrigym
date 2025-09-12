export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import pool from "@/lib/db/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// form of a login request
const LoginReq = z.object({
	email: z.string().email(),
	password: z.string().min(8),
});

type LoginResponse =
  | { ok: true; user: { id: string; name: string; email: string } }
  | { ok: false; code: string; message: string; errors?: unknown };

const SESSION_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: NextRequest) {

	try {
		
		// parse body
		let body: unknown;

		try {
			body = await req.json();
		} catch {
			return NextResponse.json(
				{ ok: false, code: "BAD_JSON", message: "Request body must be valid JSON." },
				{ status: 400 }
			);
		}

		const parsed = LoginReq.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ ok: false, code: "BAD_REQUEST", message: "Invalid payload", errors: parsed.error.flatten() },
				{ status: 400 }
			);
		}

		// get email and password
		const { email, password } = parsed.data;

		// fetch user by email
		const sql = `
		SELECT id, email, name, password_hash
		FROM users
		WHERE email = $1
		LIMIT 1
		`;

		// store what is returned in rows
		const { rows } = await pool.query(sql, [email]);
		const user = rows[0];

		// if no user, send email not found.
		if (!user)
			return NextResponse.json<LoginResponse>(
				{ ok: false, code: "INVALID_CREDENTIALS", message: "Email Address not found" },
				{ status: 401 }
			);
		
		// validate password
		const valid = await bcrypt.compare(password, user.password_hash);
		if (!valid) {
			return NextResponse.json<LoginResponse>(
				{ ok: false, code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
				{ status: 401 }
			);
		}
		
		// Create opaque session id + persist
		const sid = crypto.randomBytes(24).toString("base64url");

		// insert a server side session
		await pool.query(
		`
			INSERT INTO auth_sessions (id, user_id, data, expires_at)
			VALUES ($1, $2::uuid, '{}'::jsonb, now() + make_interval(secs => $3))
			ON CONFLICT (id) DO NOTHING
		`,
		[sid, user.id, SESSION_TTL_SEC]
		);

		// Set HttpOnly cookie + return user
		const res = NextResponse.json<LoginResponse>(
			{ ok: true, user: { id: String(user.id), name: user.name, email: user.email } },
			{ status: 200 }
		);
		res.cookies.set({
			name: "sid",
			value: sid, // opaque only
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: SESSION_TTL_SEC,
		});
		return res;

	} catch (err: any) {
		
		const isDev = process.env.NODE_ENV !== "production";
		return NextResponse.json(
			{
				ok: false,
				code: "INTERNAL",
				message: "Internal server error",
				...(isDev ? { details: err?.message, stack: err?.stack } : {}),
			},
			{ status: 500 }
		);
	}
}