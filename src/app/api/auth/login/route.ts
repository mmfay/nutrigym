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
  | { ok: true; user: { name: string; email: string; is_sys_admin: boolean } }
  | { ok: false; code: string; message: string; errors?: unknown };

// constant-time-ish compare for strings, preventing timing attacks
function safeEqual(a: string, b: string) {
	const ab = Buffer.from(a ?? "", "utf8");
	const bb = Buffer.from(b ?? "", "utf8");
	if (ab.length !== bb.length) return false;
	return crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
	try {
		
		// parse body
		let body: unknown;

		try {
			body = await req.json();
		} catch {
			return NextResponse.json(
				{ code: "BAD_JSON", message: "Request body must be valid JSON." },
				{ status: 400 }
			);
		}

		const parsed = LoginReq.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ code: "BAD_REQUEST", message: "Invalid payload", errors: parsed.error.flatten() },
				{ status: 400 }
			);
		}

		// get email and password
		const { email, password } = parsed.data;

		// fetch user by email
		const sql = `
		SELECT email, name, password_hash, true AS is_sys_admin
		FROM users
		WHERE email = $1
		LIMIT 1
		`;

		// store what is returned in rows
		const { rows } = await pool.query(sql, [email]);
		const user = rows[0];

		if (!user)
			return NextResponse.json<LoginResponse>(
				{ ok: false, code: "INVALID_CREDENTIALS", message: "Email Address not found." },
				{ status: 401 }
			);

		// verify password
		const valid = await bcrypt.compare(password, user.password_hash);
		if (!valid) {
			return NextResponse.json<LoginResponse>(
				{ ok: false, code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
				{ status: 401 }
			);
		}

		return NextResponse.json(
			{
				message: "Login successful",
				user: {
					name: user.name,
					email: user.email,
					is_sys_admin: !!user.is_sys_admin, // adjust once you add a real column
				},
			},
			{ status: 200 }
		);

	} catch (err: any) {
		
		const isDev = process.env.NODE_ENV !== "production";
		return NextResponse.json(
			{
				code: "INTERNAL",
				message: "Internal server error",
				...(isDev ? { details: err?.message, stack: err?.stack } : {}),
			},
			{ status: 500 }
		);
	}
}