export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import pool from "@/lib/db/db";
import bcrypt from "bcryptjs";

// input schema
const RegisterReq = z.object({
	user_id: z.string().min(3).max(50),         // e.g. "mmfay"
	email: z.string().email(),                  // unique
	name: z.string().min(1).max(120),
	password: z.string().min(8),                // will be hashed
});

// round of encryption
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

export async function POST(req: NextRequest) {
	
	// parse body
	let body: unknown;

	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ code: "BAD_JSON", message: "Invalid JSON." }, { status: 400 });
	}

	const parsed = RegisterReq.safeParse(body);

	if (!parsed.success) {
		return NextResponse.json(
		{ code: "BAD_REQUEST", message: "Invalid payload", errors: parsed.error.flatten() },
		{ status: 400 }
		);
	}

	const { user_id, email, name, password } = parsed.data;

	try {

		// normalize email
		const normEmail = email.trim().toLowerCase();

		// hash password
		const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

		// insert user
		const sql = `
		INSERT INTO users (user_id, email, name, password_hash)
		VALUES ($1, $2, $3, $4)
		RETURNING user_id, email, name, created_at
		`;

		const { rows } = await pool.query(sql, [user_id, normEmail, name, password_hash]);

		return NextResponse.json(
			{ ok: true, user: rows[0] },
			{ status: 201 }
		);

	} catch (err: any) {

		// Handle unique constraint violations (Postgres 23505)
		if (err?.code === "23505") {

			// Determine which unique constraint hit (optional: inspect err.detail)
			const conflict =
				(err.detail?.includes("(user_id)") && "user_id") ||
				(err.detail?.includes("(email)") && "email") ||
				"user";

			return NextResponse.json(
				{ ok: false, code: "CONFLICT", message: `${conflict} already exists` },
				{ status: 409 }
			);

		}

		const isDev = process.env.NODE_ENV !== "production";

		return NextResponse.json(
			{
				ok: false,
				code: "INTERNAL",
				message: "Server error",
				...(isDev ? { details: err?.message, stack: err?.stack } : {}),
			},
			{ status: 500 }
		);
		
	}
}
