// lib/auth/apikey.ts
import "server-only";
import crypto from "crypto";
import pool from "@/lib/db/db";
import { User } from "../dataTypes/auth";

// resolves the user behind an `Authorization: Bearer <key>` header, for the external v1 API
export async function getUserFromApiKey(req: Request): Promise<User | null> {

	const authHeader = req.headers.get("authorization") ?? "";

	if (!authHeader.startsWith("Bearer ")) return null;

	const rawKey = authHeader.slice("Bearer ".length).trim();

	if (!rawKey) return null;

	const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

	const { rows } = await pool.query<User>(
		`SELECT 
			u.id, 
			u.name, 
			u.email, 
			u.timezone
		FROM api_keys ak
		JOIN users u on u.id = ak.user_id
		WHERE ak.key_hash = $1
			AND u.is_enabled = true
		LIMIT 1`,
		[keyHash]
	);

	return rows[0] ?? null;

}