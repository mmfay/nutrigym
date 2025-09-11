export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import pool from "@/lib/db/db";
import crypto from "crypto";

// form of a login request
const LoginReq = z.object({
	email: z.string().email(),
	password: z.string().min(8),
});

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
		SELECT user_id, email, name, password_hash AS stored_password, true AS is_sys_admin
		FROM users
		WHERE email = $1
		LIMIT 1
		`;

		// store what is returned in rows
		const { rows } = await pool.query(sql, [email]);
		const user = rows[0];

		// uniform error for missing user or bad password
		if (!user || !safeEqual(password, user.stored_password)) {
			return NextResponse.json(
				{ code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
				{ status: 401 }
			);
		}

		// --- success ---
		return NextResponse.json(
			{
				message: "Login successful",
				user: {
				id: user.user_id,
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